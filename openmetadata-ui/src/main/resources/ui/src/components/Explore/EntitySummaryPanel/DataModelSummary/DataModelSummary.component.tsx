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

import { Col, Divider, Row, Typography } from 'antd';
import classNames from 'classnames';
import SummaryTagsDescription from 'components/common/SummaryTagsDescription/SummaryTagsDescription.component';
import SummaryPanelSkeleton from 'components/Skeleton/SummaryPanelSkeleton/SummaryPanelSkeleton.component';
import { ExplorePageTabs } from 'enums/Explore.enum';
import { DashboardDataModel } from 'generated/entity/data/dashboardDataModel';
import { isEmpty } from 'lodash';
import { default as React, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  DRAWER_NAVIGATION_OPTIONS,
  getEntityOverview,
} from 'utils/EntityUtils';
import SVGIcons from 'utils/SvgUtils';
import { SummaryEntityType } from '../../../../enums/EntitySummary.enum';
import { getFormattedEntityData } from '../../../../utils/EntitySummaryPanelUtils';
import SummaryList from '../SummaryList/SummaryList.component';
import { BasicEntityInfo } from '../SummaryList/SummaryList.interface';
import { DataModelSummaryProps } from './DataModelSummary.interface';

const DataModelSummary = ({
  entityDetails,
  componentType = DRAWER_NAVIGATION_OPTIONS.explore,
  tags,
  isLoading,
}: DataModelSummaryProps) => {
  const { t } = useTranslation();
  const { columns } = entityDetails;
  const [dataModelDetails, setDataModelDetails] =
    useState<DashboardDataModel>(entityDetails);

  const isExplore = useMemo(
    () => componentType === DRAWER_NAVIGATION_OPTIONS.explore,
    [componentType]
  );

  const entityInfo = useMemo(
    () =>
      getEntityOverview(ExplorePageTabs.DASHBOARD_DATA_MODEL, dataModelDetails),
    [dataModelDetails]
  );

  const formattedColumnsData: BasicEntityInfo[] = useMemo(
    () => getFormattedEntityData(SummaryEntityType.COLUMN, columns),
    [columns, dataModelDetails]
  );

  useEffect(() => {
    if (!isEmpty(entityDetails)) {
      setDataModelDetails(entityDetails);
    }
  }, [entityDetails]);

  return (
    <SummaryPanelSkeleton loading={isLoading || isEmpty(dataModelDetails)}>
      <>
        <Row className="m-md" gutter={[0, 4]}>
          <Col span={24}>
            <Row gutter={[0, 4]}>
              {entityInfo.map((info) => {
                const isOwner = info.name === t('label.owner');

                return info.visible?.includes(componentType) ? (
                  <Col key={info.name} span={24}>
                    <Row
                      className={classNames('', {
                        'p-b-md': isOwner,
                      })}
                      gutter={[16, 32]}>
                      {!isOwner ? (
                        <Col data-testid={`${info.name}-label`} span={8}>
                          <Typography.Text className="text-grey-muted">
                            {info.name}
                          </Typography.Text>
                        </Col>
                      ) : null}
                      <Col data-testid={`${info.name}-value`} span={16}>
                        {info.isLink ? (
                          <Link
                            component={Typography.Link}
                            target={info.isExternal ? '_blank' : '_self'}
                            to={{ pathname: info.url }}>
                            {info.value}
                            {info.isExternal ? (
                              <SVGIcons
                                alt="external-link"
                                className="m-l-xs"
                                icon="external-link"
                                width="12px"
                              />
                            ) : null}
                          </Link>
                        ) : (
                          <Typography.Text
                            className={classNames('text-grey-muted', {
                              'text-grey-body': !isOwner,
                            })}>
                            {info.value}
                          </Typography.Text>
                        )}
                      </Col>
                    </Row>
                  </Col>
                ) : null;
              })}
            </Row>
          </Col>
        </Row>

        <Divider className="m-y-xs" />

        {!isExplore ? (
          <>
            <SummaryTagsDescription
              entityDetail={entityDetails}
              tags={tags ? tags : []}
            />
            <Divider className="m-y-xs" />
          </>
        ) : null}

        <Divider className="m-y-xs" />

        <Row className="m-md" gutter={[0, 8]}>
          <Col span={24}>
            <Typography.Text
              className="text-base text-grey-muted"
              data-testid="column-header">
              {t('label.column-plural')}
            </Typography.Text>
          </Col>
          <Col span={24}>
            <SummaryList
              entityType={SummaryEntityType.COLUMN}
              formattedEntityData={formattedColumnsData}
            />
          </Col>
        </Row>
      </>
    </SummaryPanelSkeleton>
  );
};

export default DataModelSummary;
