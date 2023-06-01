package org.openmetadata.service.jdbi3;

import static org.openmetadata.common.utils.CommonUtil.listOrEmpty;
import static org.openmetadata.common.utils.CommonUtil.nullOrEmpty;
import static org.openmetadata.schema.type.Include.ALL;
import static org.openmetadata.service.Entity.CONTAINER;
import static org.openmetadata.service.Entity.FIELD_FOLLOWERS;
import static org.openmetadata.service.Entity.FIELD_TAGS;
import static org.openmetadata.service.Entity.STORAGE_SERVICE;

import com.google.common.collect.Lists;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.openmetadata.schema.EntityInterface;
import org.openmetadata.schema.entity.data.Container;
import org.openmetadata.schema.entity.services.StorageService;
import org.openmetadata.schema.type.*;
import org.openmetadata.service.Entity;
import org.openmetadata.service.resources.storages.ContainerResource;
import org.openmetadata.service.util.EntityUtil;
import org.openmetadata.service.util.FullyQualifiedName;

public class ContainerRepository extends EntityRepository<Container> {

  private static final String CONTAINER_UPDATE_FIELDS = "dataModel,owner,tags,extension";
  private static final String CONTAINER_PATCH_FIELDS = "dataModel,owner,tags,extension";

  public ContainerRepository(CollectionDAO dao) {
    super(
        ContainerResource.COLLECTION_PATH,
        Entity.CONTAINER,
        Container.class,
        dao.containerDAO(),
        dao,
        CONTAINER_PATCH_FIELDS,
        CONTAINER_UPDATE_FIELDS,
        null);
  }

  @Override
  public Container setFields(Container container, EntityUtil.Fields fields) throws IOException {
    setDefaultFields(container);
    container.setChildren(fields.contains("children") ? getChildrenContainers(container) : null);
    container.setParent(fields.contains("parent") ? getParentContainer(container) : null);
    container.setDataModel(fields.contains("dataModel") ? container.getDataModel() : null);
    if (container.getDataModel() != null) {
      populateDataModelColumnTags(fields.contains(FIELD_TAGS), container.getDataModel().getColumns());
    }
    container.setFollowers(fields.contains(FIELD_FOLLOWERS) ? getFollowers(container) : null);
    return container;
  }

  private void populateDataModelColumnTags(boolean setTags, List<Column> columns) {
    for (Column c : listOrEmpty(columns)) {
      c.setTags(setTags ? getTags(c.getFullyQualifiedName()) : null);
      populateDataModelColumnTags(setTags, c.getChildren());
    }
  }

  private EntityReference getParentContainer(Container container) throws IOException {
    if (container == null) return null;
    return getFromEntityRef(container.getId(), Relationship.CONTAINS, CONTAINER, false);
  }

  private void setDefaultFields(Container container) throws IOException {
    EntityReference parentServiceRef =
        getFromEntityRef(container.getId(), Relationship.CONTAINS, STORAGE_SERVICE, true);
    container.withService(parentServiceRef);
  }

  private List<EntityReference> getChildrenContainers(Container container) throws IOException {
    if (container == null) {
      return Collections.emptyList();
    }
    List<CollectionDAO.EntityRelationshipRecord> childContainerIds =
        findTo(container.getId(), CONTAINER, Relationship.CONTAINS, CONTAINER);
    return EntityUtil.populateEntityReferences(childContainerIds, CONTAINER);
  }

  @Override
  public void setFullyQualifiedName(Container container) {
    if (container.getParent() != null) {
      container.setFullyQualifiedName(
          FullyQualifiedName.add(container.getParent().getFullyQualifiedName(), container.getName()));
    } else {
      container.setFullyQualifiedName(
          FullyQualifiedName.add(container.getService().getFullyQualifiedName(), container.getName()));
    }
    if (container.getDataModel() != null) {
      setColumnFQN(container.getFullyQualifiedName(), container.getDataModel().getColumns());
    }
  }

  private void setColumnFQN(String parentFQN, List<Column> columns) {
    columns.forEach(
        c -> {
          String columnFqn = FullyQualifiedName.add(parentFQN, c.getName());
          c.setFullyQualifiedName(columnFqn);
          if (c.getChildren() != null) {
            setColumnFQN(columnFqn, c.getChildren());
          }
        });
  }

  @Override
  public void prepare(Container container) throws IOException {
    // the storage service is not fully filled in terms of props - go to the db and get it in full and re-set it
    StorageService storageService = Entity.getEntity(container.getService(), "", Include.NON_DELETED);
    container.setService(storageService.getEntityReference());
    container.setServiceType(storageService.getServiceType());

    if (container.getParent() != null) {
      Container parent = Entity.getEntity(container.getParent(), "owner", ALL);
      container.withParent(parent.getEntityReference());
    }
    // Validate field tags
    if (container.getDataModel() != null) {
      addDerivedColumnTags(container.getDataModel().getColumns());
      validateColumnTags(container.getDataModel().getColumns());
    }
  }

  @Override
  public void storeEntity(Container container, boolean update) throws IOException {
    EntityReference storageService = container.getService();
    EntityReference parent = container.getParent();
    List<EntityReference> children = container.getChildren();
    EntityReference owner = container.getOwner();
    List<TagLabel> tags = container.getTags();

    container.withService(null).withParent(null).withChildren(null).withOwner(null).withHref(null).withTags(null);

    // Don't store datamodel column tags as JSON but build it on the fly based on relationships
    List<Column> columnWithTags = Lists.newArrayList();
    if (container.getDataModel() != null) {
      columnWithTags.addAll(container.getDataModel().getColumns());
      container.getDataModel().setColumns(ColumnUtil.cloneWithoutTags(columnWithTags));
      container.getDataModel().getColumns().forEach(column -> column.setTags(null));
    }

    store(container, update);

    // Restore the relationships
    container.withService(storageService).withParent(parent).withChildren(children).withOwner(owner).withTags(tags);
    if (container.getDataModel() != null) {
      container.getDataModel().setColumns(columnWithTags);
    }
  }

  @Override
  public void restorePatchAttributes(Container original, Container updated) {
    // Patch can't make changes to following fields. Ignore the changes
    updated
        .withFullyQualifiedName(original.getFullyQualifiedName())
        .withService(original.getService())
        .withParent(original.getParent())
        .withName(original.getName())
        .withId(original.getId());
  }

  @Override
  public void storeRelationships(Container container) {

    // store each relationship separately in the entity_relationship table
    EntityReference service = container.getService();
    addRelationship(service.getId(), container.getId(), service.getType(), CONTAINER, Relationship.CONTAINS);

    // parent container if exists
    EntityReference parentReference = container.getParent();
    if (parentReference != null) {
      addRelationship(parentReference.getId(), container.getId(), CONTAINER, CONTAINER, Relationship.CONTAINS);
    }
    storeOwner(container, container.getOwner());
    applyTags(container);
  }

  @Override
  public EntityUpdater getUpdater(Container original, Container updated, Operation operation) {
    return new ContainerUpdater(original, updated, operation);
  }

  @Override
  public void applyTags(Container container) {
    // Add container level tags by adding tag to container relationship
    super.applyTags(container);
    if (container.getDataModel() != null) {
      applyTags(container.getDataModel().getColumns());
    }
  }

  private void applyTags(List<Column> columns) {
    // Add column level tags by adding tag to column relationship
    for (Column column : columns) {
      applyTags(column.getTags(), column.getFullyQualifiedName());
      if (column.getChildren() != null) {
        applyTags(column.getChildren());
      }
    }
  }

  @Override
  public List<TagLabel> getAllTags(EntityInterface entity) {
    List<TagLabel> allTags = new ArrayList<>();
    Container container = (Container) entity;
    EntityUtil.mergeTags(allTags, container.getTags());
    if (container.getDataModel() != null) {
      for (Column column : listOrEmpty(container.getDataModel().getColumns())) {
        EntityUtil.mergeTags(allTags, column.getTags());
      }
    }
    return allTags;
  }

  private void addDerivedColumnTags(List<Column> columns) {
    if (nullOrEmpty(columns)) {
      return;
    }

    for (Column column : columns) {
      column.setTags(addDerivedTags(column.getTags()));
      if (column.getChildren() != null) {
        addDerivedColumnTags(column.getChildren());
      }
    }
  }

  private void validateColumnTags(List<Column> columns) {
    // Add column level tags by adding tag to column relationship
    for (Column column : columns) {
      checkMutuallyExclusive(column.getTags());
      if (column.getChildren() != null) {
        validateColumnTags(column.getChildren());
      }
    }
  }

  /** Handles entity updated from PUT and POST operations */
  public class ContainerUpdater extends ColumnEntityUpdater {
    public ContainerUpdater(Container original, Container updated, Operation operation) {
      super(original, updated, operation);
    }

    @Override
    public void entitySpecificUpdate() throws IOException {
      updateDataModel(original, updated);
      recordChange("prefix", original.getPrefix(), updated.getPrefix());
      List<ContainerFileFormat> addedItems = new ArrayList<>();
      List<ContainerFileFormat> deletedItems = new ArrayList<>();
      recordListChange(
          "fileFormats",
          original.getFileFormats(),
          updated.getFileFormats(),
          addedItems,
          deletedItems,
          EntityUtil.containerFileFormatMatch);

      // record the changes for size and numOfObjects change without version update.
      recordChange(
          "numberOfObjects",
          original.getNumberOfObjects(),
          updated.getNumberOfObjects(),
          false,
          EntityUtil.objectMatch,
          false);
      recordChange("size", original.getSize(), updated.getSize(), false, EntityUtil.objectMatch, false);
    }

    private void updateDataModel(Container original, Container updated) throws IOException {

      if (original.getDataModel() == null || updated.getDataModel() == null) {
        recordChange("dataModel", original.getDataModel(), updated.getDataModel(), true);
      }

      if (original.getDataModel() != null && updated.getDataModel() != null) {
        updateColumns(
            "dataModel.columns",
            original.getDataModel().getColumns(),
            updated.getDataModel().getColumns(),
            EntityUtil.columnMatch);
        recordChange(
            "dataModel.partition",
            original.getDataModel().getIsPartitioned(),
            updated.getDataModel().getIsPartitioned());
      }
    }
  }
}
