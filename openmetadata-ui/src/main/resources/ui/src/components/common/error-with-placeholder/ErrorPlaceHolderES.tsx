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

import { Card, Typography } from 'antd';
import { ROUTES } from 'constants/constants';
import {
  ELASTICSEARCH_ERROR_PLACEHOLDER_TYPE,
  ERROR_PLACEHOLDER_TYPE,
} from 'enums/common.enum';
import { uniqueId } from 'lodash';
import { observer } from 'mobx-react';
import Qs from 'qs';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { Transi18next } from 'utils/CommonUtils';
import i18n from 'utils/i18next/LocalUtil';
import {
  CONNECTORS_DOCS,
  GLOSSARIES_DOCS,
  INGESTION_DOCS,
  LOCAL_DEPLOYMENT,
  OMD_SLACK_LINK,
  TAGS_DOCS,
} from '../../../constants/docs.constants';
import ErrorPlaceHolder from './ErrorPlaceHolder';

type Props = {
  type: ELASTICSEARCH_ERROR_PLACEHOLDER_TYPE;
  errorMessage?: string;
  query?: Qs.ParsedQs;
};

const stepsData = [
  {
    step: 1,
    title: i18n.t('label.ingest-sample-data'),
    description: i18n.t('message.run-sample-data-to-ingest-sample-data'),
    link: INGESTION_DOCS,
  },
  {
    step: 2,
    title: i18n.t('label.start-elasticsearch-docker'),
    description: i18n.t('message.ensure-elasticsearch-is-up-and-running'),
    link: LOCAL_DEPLOYMENT,
  },
  {
    step: 3,
    title: i18n.t('label.install-service-connectors'),
    description: i18n.t('message.checkout-service-connectors-doc'),
    link: CONNECTORS_DOCS,
  },
  {
    step: 4,
    title: i18n.t('label.more-help'),
    description: i18n.t('message.still-running-into-issue'),
    link: OMD_SLACK_LINK,
  },
];

const ErrorPlaceHolderES = ({ type, errorMessage, query }: Props) => {
  const { showDeleted, search, queryFilter, quickFilter } = query ?? {};
  const { tab } = useParams<{ tab: string }>();
  const { t } = useTranslation();
  const history = useHistory();

  const isQuery = useMemo(
    () =>
      Boolean(search || queryFilter || quickFilter || showDeleted === 'true'),
    [search, queryFilter, quickFilter, showDeleted]
  );

  const noRecordForES = useMemo(() => {
    return (
      <div className="tw-text-center" data-testid="no-search-results">
        {isQuery ? (
          <ErrorPlaceHolder type={ERROR_PLACEHOLDER_TYPE.FILTER} />
        ) : ['glossaries', 'tags'].includes(tab) ? (
          <ErrorPlaceHolder
            permission
            doc={tab === 'tags' ? TAGS_DOCS : GLOSSARIES_DOCS}
            heading={
              tab === 'tags' ? t('label.tag-plural') : t('label.glossary')
            }
            type={ERROR_PLACEHOLDER_TYPE.CREATE}
            onClick={() =>
              history.push(tab === 'tags' ? ROUTES.TAGS : ROUTES.GLOSSARY)
            }
          />
        ) : (
          <ErrorPlaceHolder>
            <Typography.Paragraph style={{ marginBottom: '0' }}>
              {t('message.add-service-connection')}
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Transi18next
                i18nKey="message.refer-to-our-doc"
                renderElement={
                  <a
                    href={CONNECTORS_DOCS}
                    rel="noreferrer"
                    style={{ color: '#1890ff' }}
                    target="_blank"
                  />
                }
                values={{
                  doc: t('label.doc-plural-lowercase'),
                }}
              />
            </Typography.Paragraph>
          </ErrorPlaceHolder>
        )}
      </div>
    );
  }, [isQuery]);

  const elasticSearchError = useMemo(() => {
    const index = errorMessage?.split('[')[3]?.split(']')[0];
    const errorText = errorMessage && index ? `find ${index} in` : 'access';

    return (
      <div className="tw-mb-5" data-testid="es-error">
        <div className="tw-mb-3 tw-text-center">
          <p>
            <span>{t('message.welcome-to-open-metadata')} </span>
            <span data-testid="error-text">
              {t('message.unable-to-error-elasticsearch', { error: errorText })}
            </span>
          </p>

          <p>{t('message.elasticsearch-setup')}</p>
        </div>
        <div className="tw-grid tw-grid-cols-4 tw-gap-4 tw-mt-5">
          {stepsData.map((data) => (
            <Card
              className="d-flex flex-col tw-justify-between tw-p-5"
              key={uniqueId()}>
              <div>
                <div className="d-flex tw-mb-2">
                  <div className="tw-rounded-full d-flex tw-justify-center tw-items-center tw-h-10 tw-w-10 tw-border-2 tw-border-primary tw-text-lg tw-font-bold tw-text-primary">
                    {data.step}
                  </div>
                </div>

                <h6
                  className="tw-text-base tw-text-grey-body tw-font-medium"
                  data-testid="service-name">
                  {data.title}
                </h6>

                <p className="tw-text-grey-body tw-pb-1 tw-text-sm tw-mb-5">
                  {data.description}
                </p>
              </div>

              <p>
                <a href={data.link} rel="noopener noreferrer" target="_blank">
                  {`${t('label.click-here')} >>`}
                </a>
              </p>
            </Card>
          ))}
        </div>
      </div>
    );
  }, [errorMessage]);

  return (
    <div className="tw-mt-10 tw-text-base tw-font-medium">
      {type === ELASTICSEARCH_ERROR_PLACEHOLDER_TYPE.NO_DATA
        ? noRecordForES
        : elasticSearchError}
    </div>
  );
};

export default observer(ErrorPlaceHolderES);
