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

import Qs from 'qs';
import { ReactNode } from 'react';
import { EntityReference } from '../../generated/entity/type';
import { TagLabel } from '../../generated/type/tagLabel';
import {
  DashboardSearchSource,
  ExploreSearchSource,
  GlossarySearchSource,
  MlmodelSearchSource,
  QuerySearchSource,
  SearchHitBody,
  TableSearchSource,
  TagClassSearchSource,
  TeamSearchSource,
  UserSearchSource,
} from '../../interface/search.interface';
import { ExploreSearchIndex } from '../Explore/explore.interface';

type Fields =
  | 'name'
  | 'fullyQualifiedName'
  | 'description'
  | 'serviceType'
  | 'displayName'
  | 'deleted'
  | 'service';

export type SourceType = (
  | Pick<
      TableSearchSource,
      Fields | 'usageSummary' | 'database' | 'databaseSchema' | 'tableType'
    >
  | Pick<DashboardSearchSource | MlmodelSearchSource, Fields | 'usageSummary'>
  | Pick<
      Exclude<
        ExploreSearchSource,
        | TableSearchSource
        | DashboardSearchSource
        | MlmodelSearchSource
        | GlossarySearchSource
        | TagClassSearchSource
        | QuerySearchSource
        | UserSearchSource
        | TeamSearchSource
      >,
      Fields
    >
) & {
  id: string;
  tier?: string | Pick<TagLabel, 'tagFQN'>;
  tags?: string[] | TagLabel[];
  entityType?: string;
  owner?: Partial<
    Pick<
      EntityReference,
      'name' | 'displayName' | 'id' | 'type' | 'fullyQualifiedName' | 'deleted'
    >
  >;
};

export interface SearchedDataProps {
  children?: ReactNode;
  selectedEntityId: string;
  data: SearchHitBody<ExploreSearchIndex, SourceType>[];
  isLoading?: boolean;
  onPaginationChange: (value: number, pageSize?: number) => void;
  totalValue: number;
  fetchLeftPanel?: () => ReactNode;
  isSummaryPanelVisible: boolean;
  showResultCount?: boolean;
  showOnboardingTemplate?: boolean;
  showOnlyChildren?: boolean;
  isFilterSelected: boolean;
  handleSummaryPanelDisplay?: (
    details: SearchedDataProps['data'][number]['_source'],
    entityType: string
  ) => void;
  filter?: Qs.ParsedQs;
}
