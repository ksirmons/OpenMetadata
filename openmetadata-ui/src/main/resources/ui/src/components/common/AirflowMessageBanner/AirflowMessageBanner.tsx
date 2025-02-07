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
import { Space, SpaceProps, Typography } from 'antd';
import { ReactComponent as IconRetry } from 'assets/svg/ic-retry-icon.svg';
import classNames from 'classnames';
import { useAirflowStatus } from 'hooks/useAirflowStatus';
import React, { FC } from 'react';
import './airflow-message-banner.less';

const AirflowMessageBanner: FC<SpaceProps> = ({ className }) => {
  const { reason, isAirflowAvailable } = useAirflowStatus();

  if (isAirflowAvailable) {
    return null;
  }

  return (
    <Space
      align="center"
      className={classNames('airflow-message-banner', className)}
      data-testid="no-airflow-placeholder"
      size={16}>
      <IconRetry height={24} width={24} />
      <Typography.Text>{reason}</Typography.Text>
    </Space>
  );
};

export default AirflowMessageBanner;
