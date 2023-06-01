/*
 *  Copyright 2021 Collate
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

package org.openmetadata.service.events.scheduled;

import static org.openmetadata.schema.api.events.CreateEventSubscription.AlertType.DATA_INSIGHT_REPORT;
import static org.openmetadata.service.Entity.EVENT_SUBSCRIPTION;
import static org.openmetadata.service.util.SubscriptionUtil.getCronSchedule;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.client.RestHighLevelClient;
import org.openmetadata.schema.entity.events.EventSubscription;
import org.openmetadata.schema.entity.events.TriggerConfig;
import org.openmetadata.service.exception.DataInsightJobException;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.jdbi3.DataInsightChartRepository;
import org.quartz.JobBuilder;
import org.quartz.JobDataMap;
import org.quartz.JobDetail;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.Trigger;
import org.quartz.TriggerBuilder;
import org.quartz.impl.StdSchedulerFactory;

@Slf4j
public class ReportsHandler {
  public static final String DATA_INSIGHT_EMAIL_JOB = "dataInsightEmailJob";
  public static final String EMAIL_REPORT = "emailReport";
  public static final String CRON_TRIGGER = "dataInsightEmailTrigger";
  public static final String JOB_CONTEXT_CHART_REPO = "dataInsightChartRepository";
  public static final String ES_REST_CLIENT = "esRestClient";
  private final RestHighLevelClient restHighLevelClient;
  private final DataInsightChartRepository chartRepository;
  private static ReportsHandler INSTANCE;
  private static volatile boolean INITIALIZED = false;
  private final Scheduler reportScheduler = new StdSchedulerFactory().getScheduler();
  private static final ConcurrentHashMap<UUID, JobDetail> reportJobKeyMap = new ConcurrentHashMap<>();

  private ReportsHandler(CollectionDAO dao, RestHighLevelClient restHighLevelClient) throws SchedulerException {
    this.restHighLevelClient = restHighLevelClient;
    this.chartRepository = new DataInsightChartRepository(dao);
    this.reportScheduler.start();
  }

  public static ReportsHandler getInstance() {
    if (INITIALIZED) return INSTANCE;
    throw new DataInsightJobException("Reports Job Handler is not Initialized");
  }

  public ConcurrentMap<UUID, JobDetail> getReportMap() {
    return reportJobKeyMap;
  }

  public static void initialize(CollectionDAO dao, RestHighLevelClient restHighLevelClient) throws SchedulerException {
    if (!INITIALIZED) {
      INSTANCE = new ReportsHandler(dao, restHighLevelClient);
      INITIALIZED = true;
    } else {
      LOG.info("Reindexing Handler is already initialized");
    }
  }

  public void addDataReportConfig(EventSubscription dataReport) {
    try {
      JobDetail jobDetail = jobBuilder(dataReport);
      Trigger trigger = trigger(dataReport.getTrigger());
      reportScheduler.scheduleJob(jobDetail, trigger);
      reportJobKeyMap.put(dataReport.getId(), jobDetail);
    } catch (Exception ex) {
      LOG.error("Failed in setting up job Scheduler for Data Reporting", ex);
    }
  }

  public void updateDataReportConfig(EventSubscription dataReport) throws SchedulerException {
    deleteDataReportConfig(dataReport);
    addDataReportConfig(dataReport);
  }

  public void deleteDataReportConfig(EventSubscription dataReport) throws SchedulerException {
    JobDetail jobDetail = getJobKey(dataReport.getId());
    if (jobDetail != null) {
      reportScheduler.deleteJob(jobDetail.getKey());
      reportJobKeyMap.remove(dataReport.getId());
    }
  }

  private JobDetail jobBuilder(EventSubscription subscription) throws IOException {
    if (subscription.getAlertType() == DATA_INSIGHT_REPORT) {
      JobDataMap dataMap = new JobDataMap();
      dataMap.put(JOB_CONTEXT_CHART_REPO, this.chartRepository);
      dataMap.put(ES_REST_CLIENT, restHighLevelClient);
      dataMap.put(EVENT_SUBSCRIPTION, subscription);
      JobBuilder jobBuilder =
          JobBuilder.newJob(DataInsightsReportJob.class)
              .withIdentity(DATA_INSIGHT_EMAIL_JOB, EMAIL_REPORT)
              .usingJobData(dataMap);
      return jobBuilder.build();
    }
    throw new IOException("Invalid Report Type");
  }

  private Trigger trigger(TriggerConfig trigger) {
    return TriggerBuilder.newTrigger()
        .withIdentity(CRON_TRIGGER, EMAIL_REPORT)
        .withSchedule(getCronSchedule(trigger))
        .build();
  }

  private JobDetail getJobKey(UUID id) {
    return reportJobKeyMap.get(id);
  }

  public static void shutDown() throws SchedulerException {
    if (INSTANCE != null) {
      INSTANCE.reportScheduler.shutdown();
    }
  }

  public Response triggerExistingDataInsightJob(EventSubscription dataReport) throws SchedulerException {
    JobDetail jobDetail = getJobKey(dataReport.getId());
    if (jobDetail != null) {
      JobDataMap dataMap = new JobDataMap();
      dataMap.put(JOB_CONTEXT_CHART_REPO, this.chartRepository);
      dataMap.put(ES_REST_CLIENT, restHighLevelClient);
      dataMap.put(EVENT_SUBSCRIPTION, dataReport);
      reportScheduler.triggerJob(jobDetail.getKey(), dataMap);
      return Response.status(Response.Status.OK).entity("Job Triggered Successfully.").build();
    }
    throw new BadRequestException("Job with given Id does not exist");
  }
}
