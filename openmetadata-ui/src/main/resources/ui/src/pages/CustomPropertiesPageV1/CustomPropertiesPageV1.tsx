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

import { Button, Col, Row, Tabs } from 'antd';
import { AxiosError } from 'axios';
import ErrorPlaceHolder from 'components/common/error-with-placeholder/ErrorPlaceHolder';
import { CustomPropertyTable } from 'components/CustomEntityDetail/CustomPropertyTable';
import PageHeader from 'components/header/PageHeader.component';
import Loader from 'components/Loader/Loader';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import {
  OperationPermission,
  ResourceEntity,
} from 'components/PermissionProvider/PermissionProvider.interface';
import SchemaEditor from 'components/schema-editor/SchemaEditor';
import TabsLabel from 'components/TabsLabel/TabsLabel.component';
import { ERROR_PLACEHOLDER_TYPE } from 'enums/common.enum';
import { EntityTabs } from 'enums/entity.enum';
import { compare } from 'fast-json-patch';
import { isEmpty, isUndefined } from 'lodash';
import { default as React, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { getTypeByFQN, updateType } from 'rest/metadataTypeAPI';
import {
  ENTITY_PATH,
  getAddCustomPropertyPath,
} from '../../constants/constants';
import { CUSTOM_PROPERTIES_DOCS } from '../../constants/docs.constants';
import { PAGE_HEADERS } from '../../constants/PageHeaders.constant';
import { Type } from '../../generated/entity/type';
import { DEFAULT_ENTITY_PERMISSION } from '../../utils/PermissionsUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import './CustomPropertiesPageV1.less';

const CustomEntityDetailV1 = () => {
  const { t } = useTranslation();
  const { tab } = useParams<{ [key: string]: string }>();
  const history = useHistory();

  const [activeTab, setActiveTab] = useState<EntityTabs>(
    EntityTabs.CUSTOM_PROPERTIES
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [selectedEntityTypeDetail, setSelectedEntityTypeDetail] =
    useState<Type>({} as Type);

  const [isButtonLoading, setIsButtonLoading] = useState<boolean>(false);

  const tabAttributePath = ENTITY_PATH[tab.toLowerCase()];

  const { getEntityPermission } = usePermissionProvider();

  const [propertyPermission, setPropertyPermission] =
    useState<OperationPermission>(DEFAULT_ENTITY_PERMISSION);

  const fetchPermission = async () => {
    try {
      const response = await getEntityPermission(
        ResourceEntity.TYPE,
        selectedEntityTypeDetail.id as string
      );
      setPropertyPermission(response);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const viewPermission = useMemo(
    () => propertyPermission.ViewAll || propertyPermission.ViewBasic,
    [propertyPermission, tab]
  );

  const editPermission = useMemo(
    () => propertyPermission.EditAll,
    [propertyPermission, tab]
  );

  const fetchTypeDetail = async (typeFQN: string) => {
    setIsLoading(true);
    try {
      const data = await getTypeByFQN(typeFQN);
      setSelectedEntityTypeDetail(data);
    } catch (error) {
      showErrorToast(error as AxiosError);
      setIsError(true);
    }
    setIsLoading(false);
  };

  const onTabChange = (activeKey: string) => {
    setActiveTab(activeKey as EntityTabs);
  };

  const handleAddProperty = () => {
    const path = getAddCustomPropertyPath(tabAttributePath);
    history.push(path);
  };

  const updateEntityType = async (properties: Type['customProperties']) => {
    setIsButtonLoading(true);
    const patch = compare(selectedEntityTypeDetail, {
      ...selectedEntityTypeDetail,
      customProperties: properties,
    });

    try {
      const data = await updateType(selectedEntityTypeDetail.id || '', patch);
      setSelectedEntityTypeDetail((prev) => ({
        ...prev,
        customProperties: data.customProperties,
      }));
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsButtonLoading(false);
    }
  };

  const customPageHeader = useMemo(() => {
    switch (tabAttributePath) {
      case ENTITY_PATH.tables:
        return PAGE_HEADERS.TABLES_CUSTOM_ATTRIBUTES;

      case ENTITY_PATH.topics:
        return PAGE_HEADERS.TOPICS_CUSTOM_ATTRIBUTES;

      case ENTITY_PATH.dashboards:
        return PAGE_HEADERS.DASHBOARD_CUSTOM_ATTRIBUTES;

      case ENTITY_PATH.pipelines:
        return PAGE_HEADERS.PIPELINES_CUSTOM_ATTRIBUTES;

      case ENTITY_PATH.mlmodels:
        return PAGE_HEADERS.ML_MODELS_CUSTOM_ATTRIBUTES;

      case ENTITY_PATH.containers:
        return PAGE_HEADERS.CONTAINER_CUSTOM_ATTRIBUTES;
      default:
        return PAGE_HEADERS.TABLES_CUSTOM_ATTRIBUTES;
    }
  }, [tabAttributePath]);

  useEffect(() => {
    if (!isUndefined(tab)) {
      setActiveTab(EntityTabs.CUSTOM_PROPERTIES);
      setIsError(false);
      fetchTypeDetail(tabAttributePath);
    }
  }, [tab]);

  useEffect(() => {
    if (selectedEntityTypeDetail?.id) {
      fetchPermission();
    }
  }, [selectedEntityTypeDetail]);

  const tabs = useMemo(() => {
    const { customProperties } = selectedEntityTypeDetail;

    return [
      {
        label: (
          <TabsLabel
            count={(customProperties || []).length}
            id={EntityTabs.CUSTOM_PROPERTIES}
            isActive={activeTab === EntityTabs.CUSTOM_PROPERTIES}
            name={t('label.custom-property-plural')}
          />
        ),
        key: EntityTabs.CUSTOM_PROPERTIES,
        children: (
          <div data-testid="entity-custom-fields">
            {isEmpty(selectedEntityTypeDetail.customProperties) ? (
              <ErrorPlaceHolder
                className="mt-24"
                doc={CUSTOM_PROPERTIES_DOCS}
                heading={t('label.property')}
                permission={editPermission}
                type={ERROR_PLACEHOLDER_TYPE.CREATE}
                onClick={handleAddProperty}
              />
            ) : (
              <>
                <div className="flex justify-end">
                  {editPermission && (
                    <Button
                      className="m-b-md p-y-xss p-x-xs rounded-4"
                      data-testid="add-field-button"
                      disabled={!editPermission}
                      size="middle"
                      type="primary"
                      onClick={handleAddProperty}>
                      {t('label.add-entity', {
                        entity: t('label.property'),
                      })}
                    </Button>
                  )}
                </div>
                <CustomPropertyTable
                  customProperties={
                    selectedEntityTypeDetail.customProperties || []
                  }
                  hasAccess={editPermission}
                  isLoading={isButtonLoading}
                  updateEntityType={updateEntityType}
                />
              </>
            )}
          </div>
        ),
      },
      {
        label: t('label.schema'),
        key: EntityTabs.SCHEMA,
        children: (
          <div data-testid="entity-schema">
            <SchemaEditor
              className="custom-properties-schemaEditor p-y-md"
              editorClass="custom-entity-schema"
              value={JSON.parse(selectedEntityTypeDetail.schema ?? '{}')}
            />
          </div>
        ),
      },
    ];
  }, [
    selectedEntityTypeDetail,
    editPermission,
    isButtonLoading,
    customPageHeader,
  ]);

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <ErrorPlaceHolder />;
  }

  if (!viewPermission) {
    return (
      <Row>
        <Col span={24}>
          <ErrorPlaceHolder type={ERROR_PLACEHOLDER_TYPE.PERMISSION} />
        </Col>
      </Row>
    );
  }

  return (
    <Row
      className="m-y-xs"
      data-testid="custom-entity-container"
      gutter={[16, 16]}>
      <Col span={24}>
        <PageHeader data={customPageHeader} />
      </Col>
      <Col className="global-settings-tabs" span={24}>
        <Tabs activeKey={activeTab} items={tabs} onChange={onTabChange} />
      </Col>
    </Row>
  );
};

export default CustomEntityDetailV1;
