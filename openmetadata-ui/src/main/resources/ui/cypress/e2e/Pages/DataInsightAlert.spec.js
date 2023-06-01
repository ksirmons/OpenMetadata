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
  descriptionBox,
  interceptURL,
  toastNotification,
  verifyResponseStatusCode,
} from '../../common/common';

const dataInsightReport = {
  triggerType: 'Scheduled',
  scheduleInfoType: 'Weekly',
  name: 'DataInsightReport',
  description:
    'Data Insight Report send to the admin (organization level) and teams (team level) at given interval.',
  updatedDescription: 'Updated Description',
};

describe('Data Insight Alert', () => {
  beforeEach(() => {
    cy.login();

    cy.get('[data-testid="appbar-item-settings"]')
      .should('exist')
      .and('be.visible')
      .click();

    interceptURL(
      'GET',
      'api/v1/events/subscriptions/name/DataInsightReport?include=all',
      'dataInsightReport'
    );

    cy.get('[data-testid="global-setting-left-panel"]')
      .contains('Data Insight Report')
      .scrollIntoView()
      .should('be.visible')
      .and('exist')
      .click();

    verifyResponseStatusCode('@dataInsightReport', 200);
  });

  it('Should have default alert with proper data', () => {
    cy.get('[data-testid="sub-heading"]')
      .should('be.visible')
      .contains(dataInsightReport.description);

    cy.get('[data-testid="trigger-type"]')
      .should('be.visible')
      .contains(dataInsightReport.triggerType);

    cy.get('[data-testid="schedule-info-type"]')
      .should('be.visible')
      .contains(dataInsightReport.scheduleInfoType);

    cy.get('[data-testid="sendToAdmins"]').should('be.visible');
    cy.get('[data-testid="sendToTeams"]').should('be.visible');
    cy.get('[data-testid="edit-button"]').should('be.visible');
  });

  it('Should Update the alert', () => {
    interceptURL(
      'GET',
      'api/v1/events/subscriptions/*',
      'dataInsightReportById'
    );
    cy.get('[data-testid="edit-button"]').should('be.visible').click();
    verifyResponseStatusCode('@dataInsightReportById', 200);

    cy.get('[data-testid="name"]')
      .should('be.visible')
      .should('be.disabled')
      .should('have.value', dataInsightReport.name);

    // update the description
    cy.get(descriptionBox)
      .scrollIntoView()
      .should('be.visible')
      .click()
      .clear()
      .type(dataInsightReport.updatedDescription);

    // update schedule info
    cy.get('[data-testid="scheduleInfo"]')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[title="Monthly"]').should('be.visible').click();

    // update send to teams and admins
    cy.get('[data-testid="sendToTeams"]')
      .scrollIntoView()
      .should('exist')
      .uncheck();

    cy.get('[data-testid="sendToAdmins"]')
      .scrollIntoView()
      .should('exist')
      .uncheck();

    interceptURL('PUT', 'api/v1/events/subscriptions', 'updatedAlert');
    interceptURL(
      'GET',
      'api/v1/events/subscriptions/name/DataInsightReport?include=all',
      'updatedDataInsightReport'
    );

    cy.get('[data-testid="save-button"]').click();

    verifyResponseStatusCode('@updatedAlert', 200);
    verifyResponseStatusCode('@updatedDataInsightReport', 200);

    // verify the updated data

    cy.get('[data-testid="sub-heading"]')
      .should('be.visible')
      .contains(dataInsightReport.updatedDescription);

    cy.get('[data-testid="trigger-type"]')
      .should('be.visible')
      .contains(dataInsightReport.triggerType);

    cy.get('[data-testid="schedule-info-type"]')
      .should('be.visible')
      .contains('Monthly');
  });

  it('Should Update the alert to default values', () => {
    interceptURL(
      'GET',
      'api/v1/events/subscriptions/*',
      'dataInsightReportById'
    );
    cy.get('[data-testid="edit-button"]').should('be.visible').click();
    verifyResponseStatusCode('@dataInsightReportById', 200);

    cy.get('[data-testid="name"]')
      .should('be.visible')
      .should('be.disabled')
      .should('have.value', dataInsightReport.name);

    // update the description
    cy.get(descriptionBox)
      .scrollIntoView()
      .should('be.visible')
      .click()
      .clear()
      .type(dataInsightReport.description);

    // update schedule info
    cy.get('[data-testid="scheduleInfo"]')
      .scrollIntoView()
      .should('be.visible')
      .click();

    cy.get('[title="Weekly"]').should('be.visible').click();

    // update send to teams and admins
    cy.get('[data-testid="sendToTeams"]')
      .scrollIntoView()
      .should('exist')
      .check();

    cy.get('[data-testid="sendToAdmins"]')
      .scrollIntoView()
      .should('exist')
      .check();

    interceptURL('PUT', 'api/v1/events/subscriptions', 'updatedAlert');
    interceptURL(
      'GET',
      'api/v1/events/subscriptions/name/DataInsightReport?include=all',
      'updatedDataInsightReport'
    );

    cy.get('[data-testid="save-button"]').click();

    verifyResponseStatusCode('@updatedAlert', 200);
    verifyResponseStatusCode('@updatedDataInsightReport', 200);

    // verify the updated data

    cy.get('[data-testid="sub-heading"]')
      .should('be.visible')
      .contains(dataInsightReport.description);

    cy.get('[data-testid="trigger-type"]')
      .should('be.visible')
      .contains(dataInsightReport.triggerType);

    cy.get('[data-testid="schedule-info-type"]')
      .should('be.visible')
      .contains(dataInsightReport.scheduleInfoType);

    cy.get('[data-testid="sendToAdmins"]').should('be.visible');
    cy.get('[data-testid="sendToTeams"]').should('be.visible');
  });

  it('Should trigger the event on click of send button', () => {
    interceptURL(
      'PUT',
      'api/v1/events/subscriptions/trigger/*',
      'triggerEvent'
    );
    cy.get('[data-testid="send-now-button"]').should('be.visible').click();
    verifyResponseStatusCode('@triggerEvent', 200);

    toastNotification('Data Insight Report sent successfully.');
  });
});
