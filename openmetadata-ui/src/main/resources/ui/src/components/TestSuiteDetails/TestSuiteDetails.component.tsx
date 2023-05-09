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

import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import ManageButton from 'components/common/entityPageInfo/ManageButton/ManageButton';
import { ROUTES } from 'constants/constants';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../hooks/authHooks';
import { useAuthContext } from '../authentication/auth-provider/AuthProvider';
import Description from '../common/description/Description';
import EntitySummaryDetails from '../common/EntitySummaryDetails/EntitySummaryDetails';
import TitleBreadcrumb from '../common/title-breadcrumb/title-breadcrumb.component';
import { TestSuiteDetailsProps } from './TestSuiteDetails.interfaces';

const TestSuiteDetails = ({
  extraInfo,
  slashedBreadCrumb,
  isDescriptionEditable,
  testSuite,
  handleUpdateOwner,
  testSuiteDescription,
  descriptionHandler,
  handleDescriptionUpdate,
  handleRestoreTestSuite,
}: TestSuiteDetailsProps) => {
  const { isAdminUser } = useAuth();
  const history = useHistory();
  const { isAuthDisabled } = useAuthContext();
  const { t } = useTranslation();

  const hasAccess = isAdminUser || isAuthDisabled;

  const afterDeleteAction = () => {
    history.push(ROUTES.TEST_SUITES);
  };

  return (
    <>
      <Space
        align="center"
        className="tw-justify-between"
        style={{ width: '100%' }}>
        <Space align="center">
          <TitleBreadcrumb
            data-testid="test-suite-breadcrumb"
            titleLinks={slashedBreadCrumb}
          />
          {testSuite?.deleted && (
            <div className="deleted-badge-button" data-testid="deleted-badge">
              <ExclamationCircleOutlined className="tw-mr-1" />
              {t('label.deleted')}
            </div>
          )}
        </Space>

        <ManageButton
          isRecursiveDelete
          afterDeleteAction={afterDeleteAction}
          allowSoftDelete={!testSuite?.deleted}
          canDelete={hasAccess}
          deleted={testSuite?.deleted}
          entityId={testSuite?.id}
          entityName={testSuite?.fullyQualifiedName as string}
          entityType="testSuite"
          onRestoreEntity={handleRestoreTestSuite}
        />
      </Space>

      <div className="tw-flex tw-gap-1 tw-mb-2 tw-mt-1 tw-flex-wrap">
        {extraInfo.map((info) => (
          <span className="tw-flex" data-testid={info.key} key={info.key}>
            <EntitySummaryDetails
              currentOwner={testSuite?.owner}
              data={info}
              updateOwner={hasAccess ? handleUpdateOwner : undefined}
            />
          </span>
        ))}
      </div>

      <Space>
        <Description
          className="test-suite-description"
          description={testSuiteDescription || ''}
          entityName={testSuite?.displayName ?? testSuite?.name}
          hasEditAccess={hasAccess}
          isEdit={isDescriptionEditable}
          onCancel={() => descriptionHandler(false)}
          onDescriptionEdit={() => descriptionHandler(true)}
          onDescriptionUpdate={handleDescriptionUpdate}
        />
      </Space>
    </>
  );
};

export default TestSuiteDetails;
