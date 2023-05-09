/*
 *  Copyright 2023 Collate.
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
import { Button, Card, Col, Row, Space, Typography } from 'antd';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { ReactComponent as PlusIcon } from 'assets/svg/plus-primary.svg';
import ProfilePicture from 'components/common/ProfilePicture/ProfilePicture';
import { UserSelectableList } from 'components/common/UserSelectableList/UserSelectableList.component';
import { UserTeamSelectableList } from 'components/common/UserTeamSelectableList/UserTeamSelectableList.component';
import TagButton from 'components/TagButton/TagButton.component';
import TagsInput from 'components/TagsInput/TagsInput.component';
import {
  DE_ACTIVE_COLOR,
  getTeamAndUserDetailsPath,
  getUserPath,
  NO_DATA_PLACEHOLDER,
} from 'constants/constants';
import { GlossaryTerm } from 'generated/entity/data/glossaryTerm';
import { EntityReference } from 'generated/type/entityReference';
import { t } from 'i18next';
import { cloneDeep, includes, isEqual } from 'lodash';
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEntityName } from 'utils/EntityUtils';
import { Glossary, TagLabel } from '../../generated/entity/data/glossary';
import { OperationPermission } from '../PermissionProvider/PermissionProvider.interface';

type props = {
  permissions: OperationPermission;
  selectedData: Glossary | GlossaryTerm;
  isGlossary: boolean;
  onUpdate: (data: GlossaryTerm | Glossary) => void;
};

const GlossaryDetailsRightPanel = ({
  permissions,
  selectedData,
  isGlossary,
  onUpdate,
}: props) => {
  const hasEditReviewerAccess = useMemo(() => {
    return permissions.EditAll || permissions.EditReviewers;
  }, [permissions]);

  const noReviewersSelected =
    selectedData.reviewers && selectedData.reviewers.length === 0;

  const handleTagsUpdate = async (updatedTags: TagLabel[]) => {
    if (updatedTags) {
      const updatedData = {
        ...selectedData,
        tags: updatedTags,
      };

      onUpdate(updatedData);
    }
  };

  const handleReviewerSave = (data: Array<EntityReference>) => {
    if (!isEqual(data, selectedData.reviewers)) {
      let updatedGlossary = cloneDeep(selectedData);
      const oldReviewer = data.filter((d) =>
        includes(selectedData.reviewers, d)
      );
      const newReviewer = data
        .filter((d) => !includes(selectedData.reviewers, d))
        .map((d) => ({ id: d.id, type: d.type }));
      updatedGlossary = {
        ...updatedGlossary,
        reviewers: [...oldReviewer, ...newReviewer],
      };
      onUpdate(updatedGlossary);
    }
  };

  const handleUpdatedOwner = (newOwner: Glossary['owner']) => {
    const updatedData = {
      ...selectedData,
      owner: newOwner,
    };
    onUpdate(updatedData);
  };

  return (
    <Card>
      <Row gutter={[0, 40]}>
        <Col data-testid="glossary-owner-name" span="24">
          <div className="d-flex items-center m-b-xss">
            <Typography.Text className="right-panel-label">
              {t('label.owner')}
            </Typography.Text>
            {(permissions.EditOwner || permissions.EditAll) &&
              selectedData.owner && (
                <UserTeamSelectableList
                  hasPermission={permissions.EditOwner || permissions.EditAll}
                  owner={selectedData.owner}
                  onUpdate={handleUpdatedOwner}>
                  <Button
                    className="cursor-pointer flex-center m-l-xss"
                    data-testid="edit-owner-button"
                    icon={<EditIcon color={DE_ACTIVE_COLOR} width="14px" />}
                    size="small"
                    type="text"
                  />
                </UserTeamSelectableList>
              )}
          </div>

          {selectedData.owner && getEntityName(selectedData.owner) && (
            <Space className="m-r-xss" size={4}>
              <ProfilePicture
                displayName={getEntityName(selectedData.owner)}
                id={selectedData.owner?.id || ''}
                name={selectedData.owner?.name || ''}
                textClass="text-xs"
                width="20"
              />
              <Link
                to={
                  selectedData.owner.type === 'team'
                    ? getTeamAndUserDetailsPath(selectedData.owner.name ?? '')
                    : getUserPath(selectedData.owner.name ?? '')
                }>
                {getEntityName(selectedData.owner)}
              </Link>
            </Space>
          )}

          {!selectedData.owner &&
            (permissions.EditOwner || permissions.EditAll) && (
              <UserTeamSelectableList
                hasPermission={permissions.EditOwner || permissions.EditAll}
                owner={selectedData.owner}
                onUpdate={handleUpdatedOwner}>
                <TagButton
                  className="tw-text-primary cursor-pointer"
                  icon={<PlusIcon height={16} name="plus" width={16} />}
                  label={t('label.add')}
                  tooltip=""
                />
              </UserTeamSelectableList>
            )}

          {!selectedData.owner &&
            !(permissions.EditOwner || permissions.EditAll) && (
              <div>{NO_DATA_PLACEHOLDER}</div>
            )}
        </Col>
        <Col span="24">
          <div
            className={`d-flex items-center ${
              selectedData.reviewers && selectedData.reviewers.length > 0
                ? 'm-b-xss'
                : ''
            }`}>
            <Typography.Text
              className="right-panel-label"
              data-testid="glossary-reviewer-heading-name">
              {t('label.reviewer-plural')}
            </Typography.Text>
            {hasEditReviewerAccess &&
              selectedData.reviewers &&
              selectedData.reviewers.length > 0 && (
                <UserSelectableList
                  hasPermission={hasEditReviewerAccess}
                  popoverProps={{ placement: 'topLeft' }}
                  selectedUsers={selectedData.reviewers ?? []}
                  onUpdate={handleReviewerSave}>
                  <Button
                    className="cursor-pointer flex-center m-l-xss"
                    data-testid="edit-reviewer-button"
                    icon={<EditIcon color={DE_ACTIVE_COLOR} width="14px" />}
                    size="small"
                    type="text"
                  />
                </UserSelectableList>
              )}
          </div>
          <div>
            {selectedData.reviewers && selectedData.reviewers.length > 0 && (
              <Space wrap data-testid="glossary-reviewer-name" size={6}>
                {selectedData.reviewers.map((reviewer) => (
                  <Space className="m-r-xss" key={reviewer.id} size={4}>
                    <ProfilePicture
                      displayName={getEntityName(reviewer)}
                      id={reviewer.id || ''}
                      name={reviewer.name || ''}
                      textClass="text-xs"
                      width="20"
                    />
                    <Link to={getUserPath(reviewer.name ?? '')}>
                      {getEntityName(reviewer)}
                    </Link>
                  </Space>
                ))}
              </Space>
            )}

            {hasEditReviewerAccess && noReviewersSelected && (
              <UserSelectableList
                hasPermission={hasEditReviewerAccess}
                popoverProps={{ placement: 'topLeft' }}
                selectedUsers={selectedData.reviewers ?? []}
                onUpdate={handleReviewerSave}>
                <TagButton
                  className="tw-text-primary cursor-pointer"
                  icon={<PlusIcon height={16} name="plus" width={16} />}
                  label={t('label.add')}
                  tooltip=""
                />
              </UserSelectableList>
            )}

            {!hasEditReviewerAccess && noReviewersSelected && (
              <div>{NO_DATA_PLACEHOLDER}</div>
            )}
          </div>
        </Col>
        <Col span="24">
          <div data-testid="glossary-tags-name">
            {isGlossary && (
              <TagsInput
                editable={permissions.EditAll || permissions.EditTags}
                tags={selectedData.tags}
                onTagsUpdate={handleTagsUpdate}
              />
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export default GlossaryDetailsRightPanel;
