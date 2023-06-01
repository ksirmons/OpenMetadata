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
import { Button, Card, Typography } from 'antd';
import AppState from 'AppState';
import EntityListSkeleton from 'components/Skeleton/MyData/EntityListSkeleton/EntityListSkeleton.component';
import { getUserPath } from 'constants/constants';
import { AssetsType } from 'enums/entity.enum';
import { EntityReference } from 'generated/entity/data/table';
import { observer } from 'mobx-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getUserById } from 'rest/userAPI';
import { getEntityName } from 'utils/EntityUtils';
import { getEntityIcon, getEntityLink } from 'utils/TableUtils';

const MyDataWidgetInternal = () => {
  const { t } = useTranslation();
  const currentUserDetails = AppState.getCurrentUserDetails();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<EntityReference[]>([]);

  const fetchMyDataAssets = async () => {
    if (!currentUserDetails || !currentUserDetails.id) {
      return;
    }
    setIsLoading(true);
    try {
      const userData = await getUserById(currentUserDetails?.id, 'owns');

      if (userData) {
        const includeData = Object.values(AssetsType);
        const owns: EntityReference[] = userData.owns ?? [];

        const includedOwnsData = owns.filter((data) =>
          includeData.includes(data.type as AssetsType)
        );

        setData(includedOwnsData.slice(0, 8));
      }
    } catch (err) {
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDataAssets();
  }, [currentUserDetails]);

  return (
    <Card
      className="card-widget"
      loading={isLoading}
      title={
        <div className="d-flex justify-between p-y-sm">
          <Typography.Text className="font-normal">
            {t('label.my-data')}
          </Typography.Text>
          {data.length ? (
            <Link
              data-testid="view-all-link"
              to={getUserPath(currentUserDetails?.name || '', 'mydata')}>
              <span className="tw-text-info font-normal text-xs">
                {t('label.view-all')}{' '}
                <span data-testid="my-data-total-count">
                  {`(${data.length})`}
                </span>
              </span>
            </Link>
          ) : null}
        </div>
      }>
      <EntityListSkeleton
        dataLength={data.length !== 0 ? data.length : 5}
        loading={Boolean(isLoading)}>
        <>
          <div className="entity-list-body">
            {data.length
              ? data.map((item, index) => {
                  return (
                    <div
                      className="right-panel-list-item flex items-center justify-between"
                      data-testid={`Recently Viewed-${getEntityName(item)}`}
                      key={index}>
                      <div className="d-flex items-center">
                        <Link
                          className=""
                          to={getEntityLink(
                            item.type || '',
                            item.fullyQualifiedName as string
                          )}>
                          <Button
                            className="entity-button d-flex p-xss"
                            icon={
                              <div className="entity-button-icon m-r-xs">
                                {getEntityIcon(item.type || '')}
                              </div>
                            }
                            type="text">
                            <Typography.Text
                              className="text-left font-thin"
                              ellipsis={{ tooltip: true }}>
                              {getEntityName(item)}
                            </Typography.Text>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              : t('server.no-owned-entities')}
          </div>
        </>
      </EntityListSkeleton>
    </Card>
  );
};

export const MyDataWidget = observer(MyDataWidgetInternal);
