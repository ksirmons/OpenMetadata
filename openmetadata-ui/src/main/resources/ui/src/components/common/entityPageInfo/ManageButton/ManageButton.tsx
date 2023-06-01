/*
 *  Copyright 2022 Collate.
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

import { Button, Dropdown, Modal, Tooltip, Typography } from 'antd';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import classNames from 'classnames';
import { ManageButtonItemLabel } from 'components/common/ManageButtonContentItem/ManageButtonContentItem.component';
import EntityNameModal from 'components/Modals/EntityNameModal/EntityNameModal.component';
import { EntityName } from 'components/Modals/EntityNameModal/EntityNameModal.interface';
import { DE_ACTIVE_COLOR } from 'constants/constants';
import { DROPDOWN_ICON_SIZE_PROPS } from 'constants/ManageButton.constants';
import React, { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactComponent as IconAnnouncementsBlack } from '../../../../assets/svg/announcements-black.svg';
import { ReactComponent as IconDelete } from '../../../../assets/svg/ic-delete.svg';
import { ReactComponent as IconRestore } from '../../../../assets/svg/ic-restore.svg';
import { ReactComponent as IconDropdown } from '../../../../assets/svg/menu.svg';
import { NO_PERMISSION_FOR_ACTION } from '../../../../constants/HelperTextUtil';
import { EntityType } from '../../../../enums/entity.enum';
import { ANNOUNCEMENT_ENTITIES } from '../../../../utils/AnnouncementsUtils';
import DeleteWidgetModal from '../../DeleteWidget/DeleteWidgetModal';
import './ManageButton.less';

interface Props {
  allowSoftDelete?: boolean;
  afterDeleteAction?: () => void;
  buttonClassName?: string;
  entityName: string;
  entityId?: string;
  entityType?: string;
  displayName?: string;
  entityFQN?: string;
  isRecursiveDelete?: boolean;
  deleteMessage?: string;
  softDeleteMessagePostFix?: string;
  hardDeleteMessagePostFix?: string;
  canDelete?: boolean;
  extraDropdownContent?: ItemType[];
  onAnnouncementClick?: () => void;
  onRestoreEntity?: () => Promise<void>;
  deleted?: boolean;
  editDisplayNamePermission?: boolean;
  onEditDisplayName?: (data: EntityName) => Promise<void>;
}

const ManageButton: FC<Props> = ({
  allowSoftDelete,
  afterDeleteAction,
  buttonClassName,
  deleteMessage,
  softDeleteMessagePostFix,
  hardDeleteMessagePostFix,
  entityName,
  displayName,
  entityType,
  canDelete,
  entityId,
  isRecursiveDelete,
  extraDropdownContent,
  onAnnouncementClick,
  onRestoreEntity,
  deleted,
  editDisplayNamePermission,
  onEditDisplayName,
}) => {
  const { t } = useTranslation();
  const [isDelete, setIsDelete] = useState<boolean>(false);
  const [showReactiveModal, setShowReactiveModal] = useState(false);
  const [isDisplayNameEditing, setIsDisplayNameEditing] = useState(false);

  const handleRestore = async () => {
    onRestoreEntity && (await onRestoreEntity());
    setShowReactiveModal(false);
  };

  const handleDisplayNameUpdate = (data: EntityName) => {
    if (onEditDisplayName) {
      onEditDisplayName(data)
        .then(() => {
          setIsDisplayNameEditing(false);
        })
        .catch(() => {
          // do nothing
        });
    }
  };

  const items: ItemType[] = [
    ...(deleted
      ? ([
          {
            label: (
              <Tooltip title={canDelete ? '' : NO_PERMISSION_FOR_ACTION}>
                <ManageButtonItemLabel
                  description={t('message.restore-action-description', {
                    entityType,
                  })}
                  icon={
                    <IconRestore
                      className="m-t-xss"
                      name="Restore"
                      {...DROPDOWN_ICON_SIZE_PROPS}
                    />
                  }
                  id="restore-button"
                  name={t('label.restore')}
                />
              </Tooltip>
            ),
            onClick: (e) => {
              if (canDelete) {
                e.domEvent.stopPropagation();
                setShowReactiveModal(true);
              }
            },
            key: 'restore-button',
          },
        ] as ItemType[])
      : []),

    ...(onAnnouncementClick &&
    ANNOUNCEMENT_ENTITIES.includes(entityType as EntityType)
      ? ([
          {
            label: (
              <ManageButtonItemLabel
                description={t('message.announcement-action-description')}
                icon={
                  <IconAnnouncementsBlack
                    className="m-t-xss"
                    name="announcement"
                    {...DROPDOWN_ICON_SIZE_PROPS}
                  />
                }
                id="announcement-button"
                name={t('label.announcement-plural')}
              />
            ),
            onClick: (e) => {
              e.domEvent.stopPropagation();
              onAnnouncementClick && onAnnouncementClick();
            },
            key: 'announcement-button',
          },
        ] as ItemType[])
      : []),

    ...(editDisplayNamePermission && onEditDisplayName
      ? ([
          {
            label: (
              <ManageButtonItemLabel
                description={t('message.update-displayName-entity', {
                  entity: entityName,
                })}
                icon={<EditIcon color={DE_ACTIVE_COLOR} width="18px" />}
                id="rename-button"
                name={t('label.rename')}
              />
            ),
            onClick: (e) => {
              e.domEvent.stopPropagation();
              setIsDisplayNameEditing(true);
            },
            key: 'rename-button',
          },
        ] as ItemType[])
      : []),
    ...(extraDropdownContent ? extraDropdownContent : []),
    ...(canDelete
      ? ([
          {
            label: (
              <ManageButtonItemLabel
                description={t(
                  'message.delete-entity-type-action-description',
                  {
                    entityType,
                  }
                )}
                icon={
                  <IconDelete
                    className="m-t-xss"
                    {...DROPDOWN_ICON_SIZE_PROPS}
                    name="Delete"
                  />
                }
                id="delete-button"
                name={t('label.delete')}
              />
            ),
            onClick: (e) => {
              if (canDelete) {
                e.domEvent.stopPropagation();
                setIsDelete(true);
              }
            },
            key: 'delete-button',
          },
        ] as ItemType[])
      : []),
  ];

  return (
    <>
      {items.length ? (
        <Dropdown
          align={{ targetOffset: [-12, 0] }}
          menu={{ items }}
          overlayClassName="manage-dropdown-list-container"
          overlayStyle={{ width: '350px' }}
          placement="bottomRight"
          trigger={['click']}>
          <Button
            className={classNames('flex-center px-1.5', buttonClassName)}
            data-testid="manage-button"
            title="Manage"
            type="default">
            <IconDropdown className="anticon self-center manage-dropdown-icon" />
          </Button>
        </Dropdown>
      ) : (
        <></>
      )}
      {isDelete && (
        <DeleteWidgetModal
          afterDeleteAction={afterDeleteAction}
          allowSoftDelete={allowSoftDelete}
          deleteMessage={deleteMessage}
          entityId={entityId || ''}
          entityName={entityName || ''}
          entityType={entityType || ''}
          hardDeleteMessagePostFix={hardDeleteMessagePostFix}
          isRecursiveDelete={isRecursiveDelete}
          softDeleteMessagePostFix={softDeleteMessagePostFix}
          visible={isDelete}
          onCancel={() => setIsDelete(false)}
        />
      )}
      {onEditDisplayName && (
        <EntityNameModal
          entity={{
            name: entityName,
            displayName,
          }}
          title={t('label.edit-entity', {
            entity: t('label.display-name'),
          })}
          visible={isDisplayNameEditing}
          onCancel={() => setIsDisplayNameEditing(false)}
          onSave={handleDisplayNameUpdate}
        />
      )}

      <Modal
        centered
        cancelButtonProps={{
          type: 'link',
        }}
        className="reactive-modal"
        closable={false}
        maskClosable={false}
        okText={t('label.restore')}
        open={showReactiveModal}
        title={t('label.restore-entity', {
          entity: entityType,
        })}
        onCancel={() => {
          setShowReactiveModal(false);
        }}
        onOk={handleRestore}>
        <Typography.Text data-testid="restore-modal-body">
          {t('message.are-you-want-to-restore', {
            entity: entityName,
          })}
        </Typography.Text>
      </Modal>
    </>
  );
};

export default ManageButton;
