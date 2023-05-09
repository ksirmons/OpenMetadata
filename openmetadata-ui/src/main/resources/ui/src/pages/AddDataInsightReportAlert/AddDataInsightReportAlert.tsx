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
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import RichTextEditor from 'components/common/rich-text-editor/RichTextEditor';
import {
  GlobalSettingOptions,
  GlobalSettingsMenuCategory,
} from 'constants/GlobalSettings.constants';
import {
  AlertType,
  EventSubscription,
  ProviderType,
  ScheduleInfo,
  TriggerType,
} from 'generated/events/eventSubscription';
import { isEmpty, map } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { createAlert, getAlertsFromId, updateAlert } from 'rest/alertsAPI';
import { StyledCard } from 'utils/Alerts/AlertsUtil';
import { getSettingPath } from 'utils/RouterUtils';
import { showErrorToast, showSuccessToast } from 'utils/ToastUtils';
import './add-data-insight-report-alert.less';

const AddDataInsightReportAlert = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm<EventSubscription>();
  const history = useHistory();
  const { fqn: alertId } = useParams<{ fqn: string }>();

  const [loading, setLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [provider, setProvider] = useState<ProviderType>(ProviderType.User);

  const isEditMode = useMemo(() => !isEmpty(alertId), [alertId]);

  const scheduleInfoOptions = useMemo(() => {
    return map(ScheduleInfo, (scheduleInfo) => ({
      label: scheduleInfo,
      value: scheduleInfo,
    })).filter((option) => option.value !== ScheduleInfo.Custom);
  }, []);

  const fetchDataInsightsAlert = async () => {
    try {
      setLoading(true);
      const response: EventSubscription = await getAlertsFromId(alertId);
      setProvider(response.provider ?? ProviderType.User);

      form.setFieldsValue({
        ...response,
      });
    } catch (error) {
      showErrorToast(
        t('server.entity-fetch-error', { entity: t('label.alert') })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: EventSubscription) => {
    setIsSaving(true);

    const api = isEditMode ? updateAlert : createAlert;

    try {
      await api({
        ...data,
        alertType: AlertType.DataInsightReport,
        provider,
      });
      showSuccessToast(
        t(`server.${isEditMode ? 'update' : 'create'}-entity-success`, {
          entity: t('label.alert-plural'),
        })
      );
      history.push(
        getSettingPath(
          GlobalSettingsMenuCategory.NOTIFICATIONS,
          GlobalSettingOptions.DATA_INSIGHT_REPORT_ALERT
        )
      );
    } catch (error) {
      showErrorToast(
        t(
          `server.${
            isEditMode ? 'entity-updating-error' : 'entity-creation-error'
          }`,
          {
            entity: t('label.alert-plural'),
          }
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (alertId) {
      fetchDataInsightsAlert();
    }
  }, [alertId]);

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Typography.Title level={5}>
          {isEditMode
            ? t('label.edit-entity', {
                entity: t('label.data-insight-report-alert'),
              })
            : t('label.create-entity', {
                entity: t('label.data-insight-report-alert'),
              })}
        </Typography.Title>
        <Typography.Text>{t('message.alerts-description')}</Typography.Text>
      </Col>

      <Col span={24}>
        <Form<EventSubscription>
          className="data-insight-report-alert-form"
          form={form}
          onFinish={handleSave}>
          <Card loading={loading}>
            <Form.Item
              label={t('label.name')}
              labelCol={{ span: 24 }}
              name="name"
              rules={[{ required: true }]}>
              <Input data-testid="name" disabled={isEditMode} />
            </Form.Item>

            <Form.Item
              label={t('label.description')}
              labelCol={{ span: 24 }}
              name="description"
              trigger="onTextChange"
              valuePropName="initialValue">
              <RichTextEditor
                data-testid="description"
                height="200px"
                initialValue=""
              />
            </Form.Item>

            <Form.Item>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Space className="w-full" direction="vertical" size={16}>
                    <StyledCard
                      heading={t('label.trigger')}
                      subHeading={t(
                        'message.data-insight-alert-trigger-description'
                      )}
                    />

                    <div>
                      <Form.Item
                        required
                        initialValue={[TriggerType.Scheduled]}
                        label={t('label.trigger-type')}
                        labelCol={{ span: 24 }}
                        name={['trigger', 'triggerType']}>
                        <Select
                          className="w-full"
                          data-testid="triggerType"
                          options={[
                            {
                              label: TriggerType.Scheduled,
                              value: TriggerType.Scheduled,
                            },
                          ]}
                        />
                      </Form.Item>

                      <Form.Item
                        required
                        label={t('label.schedule-info')}
                        labelCol={{ span: 24 }}
                        name={['trigger', 'scheduleInfo']}>
                        <Select
                          className="w-full"
                          data-testid="scheduleInfo"
                          options={scheduleInfoOptions}
                        />
                      </Form.Item>
                    </div>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space className="w-full" direction="vertical" size={16}>
                    <StyledCard
                      heading={t('label.destination')}
                      subHeading={t(
                        'message.data-insight-alert-destination-description'
                      )}
                    />

                    <div>
                      {/* Hidden field as we don't want user to change it, but required in payload */}
                      <Form.Item
                        hidden
                        name="subscriptionType"
                        rules={[
                          {
                            required: true,
                            message: t('label.field-required', {
                              field: t('label.destination'),
                            }),
                          },
                        ]}>
                        <Input />
                      </Form.Item>

                      <Space align="baseline">
                        <label>{t('label.send-to')}:</label>
                        <Form.Item
                          name={['subscriptionConfig', 'sendToAdmins']}
                          valuePropName="checked">
                          <Checkbox data-testid="sendToAdmins">
                            {t('label.admin-plural')}
                          </Checkbox>
                        </Form.Item>
                        <Form.Item
                          name={['subscriptionConfig', 'sendToTeams']}
                          valuePropName="checked">
                          <Checkbox data-testid="sendToTeams">
                            {t('label.team-plural')}
                          </Checkbox>
                        </Form.Item>
                      </Space>
                    </div>
                  </Space>
                </Col>
                <Col className="form-footer" span={24}>
                  <Button
                    data-testid="cancel-button"
                    onClick={() => history.goBack()}>
                    {t('label.cancel')}
                  </Button>
                  <Button
                    data-testid="save-button"
                    htmlType="submit"
                    loading={isSaving}
                    type="primary">
                    {t('label.save')}
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Card>
        </Form>
      </Col>
    </Row>
  );
};

export default AddDataInsightReportAlert;
