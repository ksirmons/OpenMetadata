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

import { Radio } from 'antd';
import { AssetsUnion } from 'components/Assets/AssetsSelectionModal/AssetSelectionModal.interface';
import Loader from 'components/Loader/Loader';
import { EntityType } from 'enums/entity.enum';
import { t } from 'i18next';
import { groupBy, map, startCase } from 'lodash';
import { AssetsDataType } from 'Models';
import React, { useEffect, useMemo, useState } from 'react';
import { PAGE_SIZE } from '../../../constants/constants';
import { Paging } from '../../../generated/type/paging';
import {
  getCountBadge,
  getTierFromEntityInfo,
} from '../../../utils/CommonUtils';
import ErrorPlaceHolder from '../../common/error-with-placeholder/ErrorPlaceHolder';
import NextPrevious from '../../common/next-previous/NextPrevious';
import TableDataCard from '../../common/table-data-card/TableDataCard';

interface Props {
  assetData: AssetsDataType;
  currentPage: number;
  onAssetPaginate: (num: string | number, activePage?: number) => void;
}

const AssetsTabs = ({ assetData, onAssetPaginate, currentPage }: Props) => {
  const [itemCount, setItemCount] = useState<Record<AssetsUnion, number>>({
    table: 0,
    pipeline: 0,
    mlmodel: 0,
    container: 0,
    topic: 0,
    dashboard: 0,
  });
  const [activeFilter, setActiveFilter] = useState<AssetsUnion>(
    EntityType.TABLE
  );

  useEffect(() => {
    const groupedArray = groupBy(assetData.data, 'entityType');
    setItemCount({
      table: groupedArray[EntityType.TABLE]?.length ?? 0,
      pipeline: groupedArray[EntityType.PIPELINE]?.length ?? 0,
      mlmodel: groupedArray[EntityType.MLMODEL]?.length ?? 0,
      container: groupedArray[EntityType.CONTAINER]?.length ?? 0,
      topic: groupedArray[EntityType.TOPIC]?.length ?? 0,
      dashboard: groupedArray[EntityType.DASHBOARD]?.length ?? 0,
    });
  }, [assetData.data]);

  const data = useMemo(
    () => assetData.data.filter((e) => e.entityType === activeFilter),
    [activeFilter, assetData]
  );

  if (assetData.isLoading) {
    return <Loader />;
  }

  return (
    <div data-testid="table-container">
      <Radio.Group
        className="m-b-xs"
        value={activeFilter}
        onChange={(e) => setActiveFilter(e.target.value)}>
        {map(
          itemCount,
          (value, key) =>
            value > 0 && (
              <Radio.Button key={key} value={key}>
                {startCase(key)} {getCountBadge(value)}
              </Radio.Button>
            )
        )}
      </Radio.Group>
      {data.length ? (
        <>
          {data.map((entity, index) => (
            <div className="m-b-sm" key={index}>
              <TableDataCard
                database={entity.database}
                databaseSchema={entity.databaseSchema}
                deleted={entity.deleted}
                description={entity.description}
                fullyQualifiedName={entity.fullyQualifiedName}
                id={`tabledatacard${index}`}
                indexType={entity.index}
                name={entity.name}
                owner={entity.owner}
                service={entity.service}
                serviceType={entity.serviceType || '--'}
                tags={entity.tags}
                tier={getTierFromEntityInfo(entity)}
                usage={entity.weeklyPercentileRank}
              />
            </div>
          ))}
          {assetData.total > PAGE_SIZE && assetData.data.length > 0 && (
            <NextPrevious
              isNumberBased
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              paging={{} as Paging}
              pagingHandler={onAssetPaginate}
              totalCount={assetData.total}
            />
          )}
        </>
      ) : (
        <ErrorPlaceHolder>{t('message.no-asset-available')}</ErrorPlaceHolder>
      )}
    </div>
  );
};

export default AssetsTabs;
