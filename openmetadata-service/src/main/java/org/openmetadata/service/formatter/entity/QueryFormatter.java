/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package org.openmetadata.service.formatter.entity;

import static org.openmetadata.service.formatter.util.FormatterUtil.transformMessage;

import java.util.List;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.entity.data.Query;
import org.openmetadata.schema.type.EntityReference;
import org.openmetadata.schema.type.FieldChange;
import org.openmetadata.service.formatter.decorators.MessageDecorator;
import org.openmetadata.service.formatter.util.FormatterUtil;

public class QueryFormatter implements EntityFormatter {
  @Override
  public String format(
      MessageDecorator<?> messageFormatter,
      FieldChange fieldChange,
      EntityInterface entity,
      FormatterUtil.CHANGE_TYPE changeType) {
    String newVal = getFieldValue(fieldChange.getNewValue(), entity, messageFormatter);
    String oldVal = getFieldValue(fieldChange.getOldValue(), entity, messageFormatter);
    return transformMessage(
        messageFormatter,
        new FieldChange().withNewValue(newVal).withOldValue(oldVal).withName("queryUsedIn"),
        entity,
        changeType);
  }

  private static String getFieldValue(Object fieldValue, EntityInterface entity, MessageDecorator<?> messageFormatter) {
    Query query = (Query) entity;
    StringBuilder field = new StringBuilder();
    @SuppressWarnings("unchecked")
    List<EntityReference> queryUsedIn = (List<EntityReference>) fieldValue;
    field.append("for '").append(query.getQuery()).append("', ").append(messageFormatter.getLineBreak());
    field.append("Query Used in :- ");
    int i = 1;
    for (EntityReference queryUsage : queryUsedIn) {
      field.append(messageFormatter.getEntityUrl(queryUsage.getType(), queryUsage.getFullyQualifiedName()));
      if (i < queryUsedIn.size()) {
        field.append(", ");
      }
      i++;
    }
    return field.toString();
  }
}
