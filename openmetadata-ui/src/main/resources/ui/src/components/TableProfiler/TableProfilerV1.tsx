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

import {
  Button,
  Card,
  Col,
  Form,
  Menu,
  MenuProps,
  Row,
  Select,
  Space,
  Switch,
  Tooltip,
} from 'antd';
import { DefaultOptionType } from 'antd/lib/select';
import { SwitchChangeEventHandler } from 'antd/lib/switch';
import { AxiosError } from 'axios';
import classNames from 'classnames';
import DatePickerMenu from 'components/DatePickerMenu/DatePickerMenu.component';
import { DateRangeObject } from 'components/ProfilerDashboard/component/TestSummary';
import { mockDatasetData } from 'constants/mockTourData.constants';
import { isEqual, isUndefined, map } from 'lodash';
import Qs from 'qs';
import React, { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import { getLatestTableProfileByFqn } from 'rest/tableAPI';
import { getListTestCase, ListTestCaseParams } from 'rest/testAPI';
import { ReactComponent as ColumnProfileIcon } from '../../assets/svg/column-profile.svg';
import { ReactComponent as DataQualityIcon } from '../../assets/svg/data-quality.svg';
import { ReactComponent as SettingIcon } from '../../assets/svg/ic-settings-primery.svg';
import { ReactComponent as NoDataIcon } from '../../assets/svg/no-data-icon.svg';
import { ReactComponent as TableProfileIcon } from '../../assets/svg/table-profile.svg';
import { API_RES_MAX_SIZE, ROUTES } from '../../constants/constants';
import { PAGE_HEADERS } from '../../constants/PageHeaders.constant';
import {
  DEFAULT_RANGE_DATA,
  INITIAL_TEST_RESULT_SUMMARY,
} from '../../constants/profiler.constant';
import { ProfilerDashboardType } from '../../enums/table.enum';
import { ProfileSampleType, Table } from '../../generated/entity/data/table';
import { TestCase, TestCaseStatus } from '../../generated/tests/testCase';
import { EntityType as TestType } from '../../generated/tests/testDefinition';
import { Include } from '../../generated/type/include';
import {
  formatNumberWithComma,
  formTwoDigitNmber,
} from '../../utils/CommonUtils';
import { updateTestResults } from '../../utils/DataQualityAndProfilerUtils';
import { getAddDataQualityTableTestPath } from '../../utils/RouterUtils';
import { generateEntityLink } from '../../utils/TableUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import PageHeader from '../header/PageHeader.component';
import DataQualityTab from '../ProfilerDashboard/component/DataQualityTab';
import { TableProfilerTab } from '../ProfilerDashboard/profilerDashboard.interface';
import ColumnProfileTable from './Component/ColumnProfileTable';
import ProfilerSettingsModal from './Component/ProfilerSettingsModal';
import TableProfilerChart from './Component/TableProfilerChart';
import {
  OverallTableSummeryType,
  TableProfilerProps,
  TableTestsType,
} from './TableProfiler.interface';
import './tableProfiler.less';

const TableProfilerV1: FC<TableProfilerProps> = ({
  isTableDeleted,
  permissions,
}) => {
  const { t } = useTranslation();
  const history = useHistory();
  const location = useLocation();

  const { activeTab } = useMemo(() => {
    const param = location.search;
    const searchData = Qs.parse(
      param.startsWith('?') ? param.substring(1) : param
    );

    return searchData as { activeTab: string };
  }, [location.search]);
  const isTourPage = useMemo(
    () => location.pathname.includes(ROUTES.TOUR),
    [location.pathname]
  );

  const { datasetFQN } = useParams<{ datasetFQN: string }>();
  const [table, setTable] = useState<Table>();
  const { profile, columns } = useMemo(() => {
    return { profile: table?.profile, columns: table?.columns || [] };
  }, [table]);
  const [settingModalVisible, setSettingModalVisible] = useState(false);
  const [columnTests, setColumnTests] = useState<TestCase[]>([]);
  const [tableTests, setTableTests] = useState<TableTestsType>({
    tests: [],
    results: INITIAL_TEST_RESULT_SUMMARY,
  });

  const [selectedTestCaseStatus, setSelectedTestCaseStatus] =
    useState<string>('');
  const [selectedTestType, setSelectedTestType] = useState('');
  const [deleted, setDeleted] = useState<boolean>(false);
  const [isTestCaseLoading, setIsTestCaseLoading] = useState(false);
  const [dateRangeObject, setDateRangeObject] =
    useState<DateRangeObject>(DEFAULT_RANGE_DATA);
  const isColumnProfile = activeTab === TableProfilerTab.COLUMN_PROFILE;
  const isDataQuality = activeTab === TableProfilerTab.DATA_QUALITY;
  const isTableProfile = activeTab === TableProfilerTab.TABLE_PROFILE;

  const testCaseStatusOption = useMemo(() => {
    const testCaseStatus: DefaultOptionType[] = Object.values(
      TestCaseStatus
    ).map((value) => ({
      label: value,
      value: value,
    }));
    testCaseStatus.unshift({
      label: t('label.all'),
      value: '',
    });

    return testCaseStatus;
  }, []);

  const getPageHeader = useMemo(() => {
    if (isTableProfile) {
      return PAGE_HEADERS.TABLE_PROFILE;
    } else if (isDataQuality) {
      return PAGE_HEADERS.DATA_QUALITY;
    } else {
      return PAGE_HEADERS.COLUMN_PROFILE;
    }
  }, [isTableProfile, isDataQuality]);

  const testCaseTypeOption = useMemo(() => {
    const testCaseStatus: DefaultOptionType[] = map(TestType, (value, key) => ({
      label: key,
      value: value,
    }));
    testCaseStatus.unshift({
      label: t('label.all'),
      value: '',
    });

    return testCaseStatus;
  }, []);

  const viewTest =
    permissions.ViewAll || permissions.ViewBasic || permissions.ViewTests;
  const viewProfiler =
    permissions.ViewAll || permissions.ViewBasic || permissions.ViewDataProfile;
  const editTest = permissions.EditAll || permissions.EditTests;

  const handleSettingModal = (value: boolean) => {
    setSettingModalVisible(value);
  };

  const getProfileSampleValue = () => {
    let value;
    if (profile?.profileSampleType === ProfileSampleType.Percentage) {
      value = `${profile?.profileSample ?? 100}%`;
    } else if (profile?.profileSampleType === ProfileSampleType.Rows) {
      value = `${profile?.profileSample} ${
        profile?.profileSampleType.toString().length > 1
          ? t('label.row-plural')
          : t('label.row')
      } `;
    } else {
      value = '100%';
    }

    return value;
  };

  const overallSummery: OverallTableSummeryType[] = useMemo(() => {
    return [
      {
        title: t('label.entity-count', {
          entity: t('label.row'),
        }),
        value: formatNumberWithComma(profile?.rowCount ?? 0),
      },
      {
        title: t('label.column-entity', {
          entity: t('label.count'),
        }),
        value: profile?.columnCount ?? table?.columns.length ?? 0,
      },
      {
        title: `${t('label.profile-sample-type', { type: '' })}`,
        value: getProfileSampleValue(),
      },
      {
        title: t('label.success'),
        value: formTwoDigitNmber(tableTests.results.success),
        className: 'success',
      },
      {
        title: t('label.aborted'),
        value: formTwoDigitNmber(tableTests.results.aborted),
        className: 'aborted',
      },
      {
        title: t('label.failed'),
        value: formTwoDigitNmber(tableTests.results.failed),
        className: 'failed',
      },
    ];
  }, [profile, tableTests]);

  const tabOptions = [
    {
      label: t('label.table-entity-text', {
        entityText: t('label.profile'),
      }),
      key: TableProfilerTab.TABLE_PROFILE,
      disabled: !viewProfiler,
      icon: <TableProfileIcon />,
    },
    {
      label: t('label.column-entity', {
        entity: t('label.profile'),
      }),
      key: TableProfilerTab.COLUMN_PROFILE,
      disabled: !viewProfiler,
      icon: <ColumnProfileIcon />,
    },
    {
      label: t('label.data-entity', {
        entity: t('label.quality'),
      }),
      key: TableProfilerTab.DATA_QUALITY,
      disabled: !viewTest,
      icon: <DataQualityIcon />,
    },
  ];

  const updateActiveTab = (key: string) =>
    history.push({ search: Qs.stringify({ activeTab: key }) });

  const handleTabChange: MenuProps['onClick'] = (value) => {
    updateActiveTab(value.key);
  };

  useEffect(() => {
    if (isUndefined(activeTab)) {
      updateActiveTab(
        isTourPage
          ? TableProfilerTab.COLUMN_PROFILE
          : TableProfilerTab.TABLE_PROFILE
      );
    }
  }, []);

  const handleDateRangeChange = (value: DateRangeObject) => {
    if (!isEqual(value, dateRangeObject)) {
      setDateRangeObject(value);
    }
  };

  const fetchAllTests = async (params?: ListTestCaseParams) => {
    setIsTestCaseLoading(true);
    try {
      const { data } = await getListTestCase({
        fields: 'testCaseResult,entityLink,testDefinition,testSuite',
        entityLink: generateEntityLink(table?.fullyQualifiedName || ''),
        includeAllTests: true,
        limit: API_RES_MAX_SIZE,
        include: deleted ? Include.Deleted : Include.NonDeleted,
        ...params,
      });
      const columnTestsCase: TestCase[] = [];
      const tableTests: TableTestsType = {
        tests: [],
        results: { ...INITIAL_TEST_RESULT_SUMMARY },
      };
      data.forEach((test) => {
        if (test.entityFQN === table?.fullyQualifiedName) {
          tableTests.tests.push(test);

          updateTestResults(
            tableTests.results,
            test.testCaseResult?.testCaseStatus || ''
          );

          return;
        }
        columnTestsCase.push(test);
      });
      setTableTests(tableTests);
      setColumnTests(columnTestsCase);
    } catch (error) {
      showErrorToast(error as AxiosError);
    } finally {
      setIsTestCaseLoading(false);
    }
  };

  const handleTestCaseStatusChange = (value: string) => {
    if (value !== selectedTestCaseStatus) {
      setSelectedTestCaseStatus(value);
    }
  };

  const handleTestCaseTypeChange = (value: string) => {
    if (value !== selectedTestType) {
      setSelectedTestType(value);
    }
  };

  const getFilterTestCase = () => {
    let tests: TestCase[] = [];
    if (selectedTestType === TestType.Table) {
      tests = tableTests.tests;
    } else if (selectedTestType === TestType.Column) {
      tests = columnTests;
    } else {
      tests = [...tableTests.tests, ...columnTests];
    }

    return tests.filter(
      (data) =>
        selectedTestCaseStatus === '' ||
        data.testCaseResult?.testCaseStatus === selectedTestCaseStatus
    );
  };

  const handleDeletedTestCaseClick: SwitchChangeEventHandler = (value) => {
    setDeleted(value);
    fetchAllTests({ include: value ? Include.Deleted : Include.NonDeleted });
  };

  const fetchLatestProfilerData = async () => {
    // As we are encoding the fqn in API function to apply all over the application
    // and the datasetFQN comes form url parameter which is already encoded,
    // we are decoding FQN below to avoid double encoding in the API function
    const decodedDatasetFQN = decodeURIComponent(datasetFQN);
    try {
      const response = await getLatestTableProfileByFqn(decodedDatasetFQN);
      setTable(response);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  useEffect(() => {
    if (!isUndefined(table) && viewTest && !isTourPage) {
      fetchAllTests();
    }
  }, [table, viewTest]);

  useEffect(() => {
    if (!isTableDeleted && datasetFQN && !isTourPage) {
      fetchLatestProfilerData();
    }
    if (isTourPage) {
      setTable(mockDatasetData.tableDetails as unknown as Table);
    }
  }, [datasetFQN]);

  return (
    <Row
      className="table-profiler-container h-full flex-grow m-y-md"
      data-testid="table-profiler-container"
      gutter={[16, 16]}
      id="profilerDetails">
      <Col span={4}>
        <Card className="h-full dataset-left-panel">
          <Menu
            className="h-full p-x-0 custom-menu"
            data-testid="profiler-tab-left-panel"
            items={tabOptions}
            mode="inline"
            selectedKeys={[activeTab ?? TableProfilerTab.TABLE_PROFILE]}
            onClick={handleTabChange}
          />
        </Card>
      </Col>
      <Col span={20}>
        <Card>
          <Space className="w-full h-min-full" direction="vertical">
            <Row className="m-b-md">
              <Col span={10}>
                <PageHeader data={getPageHeader} />
              </Col>
              <Col span={14}>
                <Space align="center" className="w-full justify-end">
                  {isDataQuality && (
                    <>
                      <Form.Item
                        className="m-0"
                        label={t('label.deleted', {
                          entity: t('label.test-plural'),
                        })}>
                        <Switch
                          checked={deleted}
                          onClick={handleDeletedTestCaseClick}
                        />
                      </Form.Item>
                      <Form.Item className="m-0 w-40" label={t('label.type')}>
                        <Select
                          options={testCaseTypeOption}
                          value={selectedTestType}
                          onChange={handleTestCaseTypeChange}
                        />
                      </Form.Item>
                      <Form.Item className="m-0 w-40" label={t('label.status')}>
                        <Select
                          options={testCaseStatusOption}
                          value={selectedTestCaseStatus}
                          onChange={handleTestCaseStatusChange}
                        />
                      </Form.Item>
                    </>
                  )}

                  {isTableProfile && (
                    <DatePickerMenu
                      showSelectedCustomRange
                      handleDateRangeChange={handleDateRangeChange}
                    />
                  )}

                  <Link
                    to={
                      editTest
                        ? getAddDataQualityTableTestPath(
                            ProfilerDashboardType.TABLE,
                            `${table?.fullyQualifiedName}`
                          )
                        : '#'
                    }>
                    <Tooltip
                      title={
                        !editTest && t('message.no-permission-for-action')
                      }>
                      <Button
                        className="rounded-4"
                        data-testid="profiler-add-table-test-btn"
                        disabled={!editTest}
                        type="primary">
                        {t('label.add-entity', {
                          entity: t('label.test'),
                        })}
                      </Button>
                    </Tooltip>
                  </Link>

                  <Tooltip
                    placement="topRight"
                    title={
                      editTest
                        ? t('label.setting-plural')
                        : t('message.no-permission-for-action')
                    }>
                    <Button
                      className="manage-dropdown-button"
                      data-testid="profiler-setting-btn"
                      disabled={!editTest}
                      type="primary"
                      onClick={() => handleSettingModal(true)}>
                      <SettingIcon className="text-primary self-center manage-dropdown-icon" />
                    </Button>
                  </Tooltip>
                </Space>
              </Col>
            </Row>

            {isUndefined(profile) && (
              <div
                className="tw-border d-flex tw-items-center tw-border-warning tw-rounded tw-p-2 tw-mb-4"
                data-testid="no-profiler-placeholder">
                <NoDataIcon />
                <p className="tw-mb-0 tw-ml-2">
                  {t('message.no-profiler-message')}
                  <Link
                    className="tw-ml-1"
                    target="_blank"
                    to={{
                      pathname:
                        'https://docs.open-metadata.org/connectors/ingestion/workflows/profiler',
                    }}>
                    {`${t('label.here-lowercase')}.`}
                  </Link>
                </p>
              </div>
            )}

            <Row className="rounded-4 border-1 p-md m-b-md">
              {overallSummery.map((summery) => (
                <Col
                  className="overall-summery-card"
                  data-testid={`header-card-${summery.title}`}
                  key={summery.title}
                  span={4}>
                  <p className="overall-summery-card-title font-medium text-grey-muted m-b-xss">
                    {summery.title}
                  </p>
                  <p
                    className={classNames(
                      'text-2xl font-semibold',
                      summery.className
                    )}>
                    {summery.value}
                  </p>
                </Col>
              ))}
            </Row>

            {isColumnProfile && (
              <ColumnProfileTable
                columnTests={columnTests}
                columns={columns.map((col) => ({
                  ...col,
                  key: col.name,
                }))}
                hasEditAccess={editTest}
              />
            )}

            {isDataQuality && (
              <DataQualityTab
                deletedTable={deleted}
                isLoading={isTestCaseLoading}
                testCases={getFilterTestCase()}
                onTestUpdate={fetchAllTests}
              />
            )}

            {isTableProfile && (
              <TableProfilerChart dateRangeObject={dateRangeObject} />
            )}

            {settingModalVisible && (
              <ProfilerSettingsModal
                columns={columns}
                tableId={table?.id || ''}
                visible={settingModalVisible}
                onVisibilityChange={handleSettingModal}
              />
            )}
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default TableProfilerV1;
