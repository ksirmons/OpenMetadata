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

import { AxiosError } from 'axios';
import ErrorPlaceHolderIngestion from 'components/common/error-with-placeholder/ErrorPlaceHolderIngestion';
import Ingestion from 'components/Ingestion/Ingestion.component';
import Loader from 'components/Loader/Loader';
import { usePermissionProvider } from 'components/PermissionProvider/PermissionProvider';
import { OPENMETADATA } from 'constants/Services.constant';
import { ServiceCategory } from 'enums/service.enum';
import { DatabaseService } from 'generated/entity/services/databaseService';
import { IngestionPipeline } from 'generated/entity/services/ingestionPipelines/ingestionPipeline';
import { Paging } from 'generated/type/paging';
import { useAirflowStatus } from 'hooks/useAirflowStatus';
import { ServicesType } from 'interface/service.interface';
import { isUndefined } from 'lodash';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  deleteIngestionPipelineById,
  deployIngestionPipelineById,
  enableDisableIngestionPipelineById,
  getIngestionPipelines,
  triggerIngestionPipelineById,
} from 'rest/ingestionPipelineAPI';
import { fetchAirflowConfig } from 'rest/miscAPI';
import { getServiceByFQN } from 'rest/serviceAPI';
import { showErrorToast } from 'utils/ToastUtils';
import { SettingsIngestionProps } from './SettingsIngestion.interface';

function SettingsIngestion({ pipelineType }: SettingsIngestionProps) {
  const { t } = useTranslation();
  const { permissions } = usePermissionProvider();
  const { isAirflowAvailable } = useAirflowStatus();
  const [isLoading, setIsLoading] = useState(true);
  const [serviceList] = useState<Array<DatabaseService>>([]);
  const [ingestionPipelines, setIngestionPipelines] = useState<
    IngestionPipeline[]
  >([]);
  const [serviceDetails, setServiceDetails] = useState<ServicesType>();
  const [airflowEndpoint, setAirflowEndpoint] = useState<string>();
  const [ingestionPaging, setIngestionPaging] = useState<Paging>({} as Paging);
  const [ingestionCurrentPage, setIngestionCurrentPage] = useState(1);

  const serviceCategory = ServiceCategory.METADATA_SERVICES;
  const serviceFQN = OPENMETADATA;

  const getAirflowEndpoint = async () => {
    try {
      setIsLoading(true);
      const res = await fetchAirflowConfig();
      setAirflowEndpoint(res.apiEndpoint);
    } catch (err) {
      showErrorToast(
        err as AxiosError,
        t('server.entity-fetch-error', {
          entity: t('label.airflow-config-plural'),
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getAllIngestionWorkflows = async (paging?: string) => {
    setIsLoading(true);
    try {
      const res = await getIngestionPipelines(
        ['pipelineStatuses'],
        serviceFQN,
        paging
      );

      if (res.data) {
        setIngestionPipelines(
          res.data.filter((pipeline) => pipeline.pipelineType === pipelineType)
        );
        setIngestionPaging(res.paging);
      } else {
        setIngestionPaging({} as Paging);
        showErrorToast(
          t('server.entity-fetch-error', {
            entity: t('label.ingestion-workflow-lowercase'),
          })
        );
      }
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        t('server.entity-fetch-error', {
          entity: t('label.ingestion-workflow-lowercase'),
        })
      );
    } finally {
      setIsLoading(false);
      if (!airflowEndpoint) {
        getAirflowEndpoint();
      }
    }
  };

  const updateCurrentSelectedIngestion = (
    id: string,
    data: IngestionPipeline | undefined,
    updateKey: keyof IngestionPipeline,
    isDeleted = false
  ) => {
    const rowIndex = ingestionPipelines.findIndex((row) => row.id === id);

    const updatedRow = !isUndefined(data)
      ? { ...ingestionPipelines[rowIndex], [updateKey]: data[updateKey] }
      : null;

    const updatedData = isDeleted
      ? ingestionPipelines.filter((_, index) => index !== rowIndex)
      : updatedRow
      ? Object.assign([...ingestionPipelines], { [rowIndex]: updatedRow })
      : [...ingestionPipelines];

    setIngestionPipelines(updatedData);
  };

  const deployIngestion = async (id: string) => {
    try {
      const res = await deployIngestionPipelineById(id);

      if (res.data) {
        setTimeout(() => {
          updateCurrentSelectedIngestion(id, res.data, 'fullyQualifiedName');

          setIsLoading(false);
        }, 500);
      } else {
        throw t('server.entity-updating-error', {
          entity: t('label.ingestion-workflow-lowercase'),
        });
      }
    } catch (err) {
      showErrorToast(
        err as AxiosError,
        t('server.entity-updating-error', {
          entity: t('label.ingestion-workflow-lowercase'),
        })
      );
    }
  };

  const deleteIngestionById = async (id: string, displayName: string) => {
    try {
      await deleteIngestionPipelineById(id);

      setIngestionPipelines((ingestionPipeline) =>
        ingestionPipeline.filter((pipeline) => pipeline.id !== id)
      );
    } catch (error) {
      showErrorToast(
        error as AxiosError,
        t('server.ingestion-workflow-operation-error', {
          operation: t('label.deleting-lowercase'),
          displayName,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableDisableIngestion = async (id: string) => {
    try {
      const res = await enableDisableIngestionPipelineById(id);
      if (res.data) {
        updateCurrentSelectedIngestion(id, res.data, 'enabled');
      } else {
        throw t('server.unexpected-response');
      }
    } catch (err) {
      showErrorToast(err as AxiosError, t('server.unexpected-response'));
    }
  };

  const triggerIngestionById = async (id: string, displayName: string) => {
    try {
      const data = await triggerIngestionPipelineById(id);

      updateCurrentSelectedIngestion(id, data, 'pipelineStatuses');
    } catch (err) {
      showErrorToast(
        t('server.ingestion-workflow-operation-error', {
          operation: t('label.triggering-lowercase'),
          displayName,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const ingestionPagingHandler = (
    cursorType: string | number,
    activePage?: number
  ) => {
    const pagingString = `&${cursorType}=${
      ingestionPaging[cursorType as keyof Paging]
    }`;

    getAllIngestionWorkflows(pagingString);
    setIngestionCurrentPage(activePage ?? 1);
  };

  const fetchMetadataServiceDetails = async () => {
    try {
      setIsLoading(true);
      const res = await getServiceByFQN(serviceCategory, serviceFQN);
      if (res) {
        setServiceDetails(res);
      } else {
        showErrorToast(
          t('server.entity-fetch-error', {
            entity: t('label.service-detail-lowercase-plural'),
          })
        );
      }
    } catch (err) {
      showErrorToast(
        err as AxiosError,
        t('server.entity-fetch-error', {
          entity: t('label.service-detail-lowercase-plural'),
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadataServiceDetails();
  }, [serviceFQN, serviceCategory]);

  useEffect(() => {
    if (isAirflowAvailable) {
      getAllIngestionWorkflows();
    }
  }, [isAirflowAvailable]);

  return isLoading ? (
    <Loader />
  ) : isAirflowAvailable ? (
    <Ingestion
      isRequiredDetailsAvailable
      airflowEndpoint={airflowEndpoint ?? ''}
      currentPage={ingestionCurrentPage}
      deleteIngestion={deleteIngestionById}
      deployIngestion={deployIngestion}
      handleEnableDisableIngestion={handleEnableDisableIngestion}
      ingestionList={ingestionPipelines}
      paging={ingestionPaging}
      pagingHandler={ingestionPagingHandler}
      permissions={permissions.metadataService}
      pipelineType={pipelineType}
      serviceCategory={serviceCategory}
      serviceDetails={serviceDetails as ServicesType}
      serviceList={serviceList}
      serviceName={serviceFQN}
      triggerIngestion={triggerIngestionById}
      onIngestionWorkflowsUpdate={getAllIngestionWorkflows}
    />
  ) : (
    <ErrorPlaceHolderIngestion />
  );
}

export default SettingsIngestion;
