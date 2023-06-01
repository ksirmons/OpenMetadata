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
// / <reference types="Cypress" />

import {
  checkServiceFieldSectionHighlighting,
  deleteCreatedService,
  editOwnerforCreatedService,
  goToAddNewServicePage,
  testServiceCreationAndIngestion,
  updateDescriptionForIngestedTables,
  uuid,
} from '../../common/common';
import {
  API_SERVICE,
  MYDATA_SUMMARY_OPTIONS,
  SERVICE_TYPE,
} from '../../constants/constants';

const serviceType = 'Airflow';
const serviceName = `${serviceType}-ct-test-${uuid()}`;
const tableName = 'index_metadata';
const description = `This is ${tableName} description`;

const connectionInput = () => {
  cy.get('#root\\/hostPort').type(Cypress.env('airflowHostPort'));
  checkServiceFieldSectionHighlighting('hostPort');
  cy.get('#root\\/connection__oneof_select')
    .scrollIntoView()
    .select('BackendConnection');
  checkServiceFieldSectionHighlighting('connection');
};

describe('Airflow Ingestion', () => {
  beforeEach(() => {
    cy.login();
  });

  it('add and ingest data', () => {
    goToAddNewServicePage(SERVICE_TYPE.Pipeline);

    testServiceCreationAndIngestion({
      serviceType,
      connectionInput,
      serviceName,
      type: SERVICE_TYPE.Pipeline,
      serviceCategory: SERVICE_TYPE.Pipeline,
    });
  });

  // Todo: unskip below test once issue is fixed https://github.com/open-metadata/OpenMetadata/issues/11676
  it.skip('Update pipeline description and verify description after re-run', () => {
    updateDescriptionForIngestedTables(
      serviceName,
      tableName,
      description,
      SERVICE_TYPE.Pipeline,
      MYDATA_SUMMARY_OPTIONS.pipelines
    );
  });

  it('Edit and validate owner', () => {
    editOwnerforCreatedService(
      SERVICE_TYPE.Pipeline,
      serviceName,
      API_SERVICE.pipelineServices
    );
  });

  it('delete created service', () => {
    deleteCreatedService(
      SERVICE_TYPE.Pipeline,
      serviceName,
      API_SERVICE.pipelineServices
    );
  });
});
