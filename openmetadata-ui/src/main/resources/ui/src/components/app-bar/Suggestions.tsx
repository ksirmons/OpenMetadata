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

import { AxiosError } from 'axios';
import { ContainerSearchSource } from 'interface/search.interface';
import React, { useEffect, useRef, useState } from 'react';
import { getSuggestions } from 'rest/miscAPI';
import {
  filterOptionsByIndex,
  getGroupLabel,
  getSuggestionElement,
} from 'utils/SearchUtils';
import { SearchIndex } from '../../enums/search.enum';
import jsonData from '../../jsons/en';
import { showErrorToast } from '../../utils/ToastUtils';
import {
  DashboardSource,
  GlossarySource,
  MlModelSource,
  Option,
  PipelineSource,
  SearchSuggestions,
  TableSource,
  TagSource,
  TopicSource,
} from '../GlobalSearchProvider/GlobalSearchSuggestions/GlobalSearchSuggestions.interface';

type SuggestionProp = {
  searchText: string;
  searchCriteria: SearchIndex | null;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

const Suggestions = ({
  searchText,
  isOpen,
  setIsOpen,
  searchCriteria,
}: SuggestionProp) => {
  const [options, setOptions] = useState<Array<Option>>([]);
  const [tableSuggestions, setTableSuggestions] = useState<TableSource[]>([]);
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSource[]>([]);
  const [dashboardSuggestions, setDashboardSuggestions] = useState<
    DashboardSource[]
  >([]);

  const [pipelineSuggestions, setPipelineSuggestions] = useState<
    PipelineSource[]
  >([]);
  const [mlModelSuggestions, setMlModelSuggestions] = useState<MlModelSource[]>(
    []
  );
  const [containerSuggestions, setContainerSuggestions] = useState<
    ContainerSearchSource[]
  >([]);
  const [glossarySuggestions, setGlossarySuggestions] = useState<
    GlossarySource[]
  >([]);
  const [tagSuggestions, setTagSuggestions] = useState<TagSource[]>([]);
  const isMounting = useRef(true);

  const setSuggestions = (options: Array<Option>) => {
    setTableSuggestions(filterOptionsByIndex(options, SearchIndex.TABLE));
    setTopicSuggestions(filterOptionsByIndex(options, SearchIndex.TOPIC));
    setDashboardSuggestions(
      filterOptionsByIndex(options, SearchIndex.DASHBOARD)
    );
    setPipelineSuggestions(filterOptionsByIndex(options, SearchIndex.PIPELINE));
    setMlModelSuggestions(filterOptionsByIndex(options, SearchIndex.MLMODEL));
    setContainerSuggestions(
      filterOptionsByIndex(options, SearchIndex.CONTAINER)
    );
    setGlossarySuggestions(filterOptionsByIndex(options, SearchIndex.GLOSSARY));
    setTagSuggestions(filterOptionsByIndex(options, SearchIndex.TAG));
  };

  const getSuggestionsForIndex = (
    suggestions: SearchSuggestions,
    searchIndex: SearchIndex
  ) => {
    if (suggestions.length === 0) {
      return null;
    }

    return (
      <>
        {getGroupLabel(searchIndex)}
        {suggestions.map((suggestion: SearchSuggestions[number]) => {
          return getSuggestionElement(suggestion, searchIndex, false, () =>
            setIsOpen(false)
          );
        })}
      </>
    );
  };

  const getEntitiesSuggestions = () => {
    return (
      <div className="py-1" role="none">
        {[
          { suggestions: tableSuggestions, searchIndex: SearchIndex.TABLE },
          { suggestions: topicSuggestions, searchIndex: SearchIndex.TOPIC },
          {
            suggestions: dashboardSuggestions,
            searchIndex: SearchIndex.DASHBOARD,
          },
          {
            suggestions: pipelineSuggestions,
            searchIndex: SearchIndex.PIPELINE,
          },
          { suggestions: mlModelSuggestions, searchIndex: SearchIndex.MLMODEL },
          {
            suggestions: containerSuggestions,
            searchIndex: SearchIndex.CONTAINER,
          },
          {
            suggestions: glossarySuggestions,
            searchIndex: SearchIndex.GLOSSARY,
          },
          { suggestions: tagSuggestions, searchIndex: SearchIndex.TAG },
        ].map(({ suggestions, searchIndex }) =>
          getSuggestionsForIndex(suggestions, searchIndex)
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!isMounting.current && searchText) {
      getSuggestions(searchText, searchCriteria ?? undefined)
        .then((res) => {
          if (res.data) {
            setOptions(
              res.data.suggest['metadata-suggest'][0]
                .options as unknown as Option[]
            );
            setSuggestions(
              res.data.suggest['metadata-suggest'][0]
                .options as unknown as Option[]
            );
          } else {
            throw jsonData['api-error-messages']['unexpected-server-response'];
          }
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['fetch-suggestions-error']
          );
        });
    }
  }, [searchText, searchCriteria]);

  // always Keep this useEffect at the end...
  useEffect(() => {
    isMounting.current = false;
  }, []);

  return (
    <>
      {options.length > 0 && isOpen ? (
        <>
          <button
            className="tw-z-10 tw-fixed tw-inset-0 tw-h-full tw-w-full tw-bg-black tw-opacity-0 "
            data-testid="suggestion-overlay"
            onClick={() => setIsOpen(false)}
          />
          <div
            aria-labelledby="menu-button"
            aria-orientation="vertical"
            className="suggestions-menu tw-origin-top-right tw-absolute z-400
          tw-w-600 tw-mt-1 tw-rounded-md tw-shadow-lg
        tw-bg-white tw-ring-1 tw-ring-black tw-ring-opacity-5 focus:tw-outline-none"
            role="menu">
            {getEntitiesSuggestions()}
          </div>
        </>
      ) : null}
    </>
  );
};

export default Suggestions;
