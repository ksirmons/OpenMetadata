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

const serviceType = 'Mlflow';
const serviceName = `${serviceType}-ct-test-${uuid()}`;
const tableName = 'ElasticnetWineModel';
const description = `This is ${tableName} description`;

const connectionInput = () => {
  cy.get('#root\\/trackingUri').type(Cypress.env('mlModelTrackingUri'));
  checkServiceFieldSectionHighlighting('trackingUri');
  cy.get('#root\\/registryUri').type(Cypress.env('mlModelRegistryUri'));
  checkServiceFieldSectionHighlighting('registryUri');
};

describe('ML Flow Ingestion', () => {
  beforeEach(() => {
    cy.login();
  });

  it('add and ingest data', () => {
    goToAddNewServicePage(SERVICE_TYPE.MLModels);

    testServiceCreationAndIngestion({
      serviceType,
      connectionInput,
      serviceName,
      type: SERVICE_TYPE.MLModels,
      serviceCategory: 'MlModel',
    });
  });

  it('Update MlModel description and verify description after re-run', () => {
    updateDescriptionForIngestedTables(
      serviceName,
      tableName,
      description,
      SERVICE_TYPE.MLModels,
      MYDATA_SUMMARY_OPTIONS.mlmodels
    );
  });

  it('Edit and validate owner', () => {
    editOwnerforCreatedService(
      SERVICE_TYPE.MLModels,
      serviceName,
      API_SERVICE.mlmodelServices
    );
  });

  it('delete created service', () => {
    deleteCreatedService(
      SERVICE_TYPE.MLModels,
      serviceName,
      API_SERVICE.mlmodelServices,
      'Mlmodel'
    );
  });
});
