/*
 *  Copyright 2022 Collate
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

package org.openmetadata.service.util;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import javax.ws.rs.core.Response;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.elasticsearch.client.RestHighLevelClient;
import org.openmetadata.common.utils.CommonUtil;
import org.openmetadata.schema.api.CreateEventPublisherJob;
import org.openmetadata.schema.system.EventPublisherJob;
import org.openmetadata.schema.system.Failure;
import org.openmetadata.schema.system.Stats;
import org.openmetadata.service.Entity;
import org.openmetadata.service.elasticsearch.ElasticSearchIndexDefinition;
import org.openmetadata.service.exception.CustomExceptionMessage;
import org.openmetadata.service.exception.UnhandledServerException;
import org.openmetadata.service.jdbi3.CollectionDAO;
import org.openmetadata.service.workflows.searchIndex.ReindexingUtil;
import org.openmetadata.service.workflows.searchIndex.SearchIndexWorkflow;

@Slf4j
public class ReIndexingHandler {
  public static final String REINDEXING_JOB_EXTENSION = "reindexing.eventPublisher";
  private static ReIndexingHandler INSTANCE;
  private static volatile boolean INITIALIZED = false;
  private static CollectionDAO dao;
  private static RestHighLevelClient client;
  private static ElasticSearchIndexDefinition esIndexDefinition;
  private static ExecutorService threadScheduler;
  private final Map<UUID, SearchIndexWorkflow> REINDEXING_JOB_MAP = new LinkedHashMap<>();
  private static BlockingQueue<Runnable> taskQueue;

  private ReIndexingHandler() {}

  public static ReIndexingHandler getInstance() {
    return INSTANCE;
  }

  public static void initialize(
      RestHighLevelClient restHighLevelClient,
      ElasticSearchIndexDefinition elasticSearchIndexDefinition,
      CollectionDAO daoObject) {
    if (!INITIALIZED) {
      client = restHighLevelClient;
      dao = daoObject;
      esIndexDefinition = elasticSearchIndexDefinition;
      taskQueue = new ArrayBlockingQueue<>(5);
      threadScheduler = new ThreadPoolExecutor(5, 5, 0L, TimeUnit.MILLISECONDS, taskQueue);
      INSTANCE = new ReIndexingHandler();
      INITIALIZED = true;
    } else {
      LOG.info("Reindexing Handler is already initialized");
    }
  }

  @SneakyThrows
  public EventPublisherJob createReindexingJob(String startedBy, CreateEventPublisherJob createReindexingJob) {
    // Remove jobs in case they are completed
    clearCompletedJobs();

    // validate current job
    validateJob(createReindexingJob);

    // Create new Task
    if (taskQueue.size() >= 5) {
      throw new UnhandledServerException("Cannot create new Reindexing Jobs. There are pending jobs.");
    }
    if (((ThreadPoolExecutor) threadScheduler).getActiveCount() > 5) {
      throw new UnhandledServerException("Thread unavailable to run the jobs. There are pending jobs.");
    } else {
      EventPublisherJob jobData = getReindexJob(startedBy, createReindexingJob);
      List<SearchIndexWorkflow> activeJobs = new ArrayList<>(REINDEXING_JOB_MAP.values());
      Set<String> entityList = jobData.getEntities();
      for (SearchIndexWorkflow job : activeJobs) {
        EventPublisherJob runningJob = job.getJobData();
        runningJob.getEntities().forEach(entityList::remove);
      }

      LOG.info("Reindexing triggered for the following Entities: {}", entityList);

      if (!entityList.isEmpty()) {
        // Check if the after cursor is provided
        if (!CommonUtil.nullOrEmpty(jobData.getAfterCursor()) && entityList.size() > 1) {
          throw new IllegalArgumentException("After Cursor can only be associated with one entity");
        }

        // Remove previous run,
        dao.entityExtensionTimeSeriesDao().deleteLastRecords(REINDEXING_JOB_EXTENSION, 5);
        // Create Entry in the DB
        dao.entityExtensionTimeSeriesDao()
            .insert(
                jobData.getId().toString(),
                REINDEXING_JOB_EXTENSION,
                "eventPublisherJob",
                JsonUtils.pojoToJson(jobData));
        // Create Job
        SearchIndexWorkflow job = new SearchIndexWorkflow(dao, esIndexDefinition, client, jobData);
        threadScheduler.submit(job);
        REINDEXING_JOB_MAP.put(jobData.getId(), job);
        return jobData;
      } else {
        throw new UnhandledServerException(
            "There are already executing Jobs working on the same Entities. Please try later.");
      }
    }
  }

  private void clearCompletedJobs() {
    REINDEXING_JOB_MAP
        .entrySet()
        .removeIf(
            entry ->
                entry.getValue().getJobData().getStatus() != EventPublisherJob.Status.STARTED
                    && entry.getValue().getJobData().getStatus() != EventPublisherJob.Status.RUNNING);
  }

  public EventPublisherJob stopRunningJob(UUID jobId) {
    SearchIndexWorkflow job = REINDEXING_JOB_MAP.get(jobId);
    if (job != null) {
      job.stopJob();
      return job.getJobData();
    }
    throw new CustomExceptionMessage(Response.Status.BAD_REQUEST, "Job is not in Running state.");
  }

  private void validateJob(CreateEventPublisherJob job) {
    // Check valid Entities are provided
    Objects.requireNonNull(job);
    Set<String> storedEntityList = new HashSet<>(Entity.getEntityList());
    if (!job.getEntities().isEmpty()) {
      job.getEntities()
          .forEach(
              entityType -> {
                if (!storedEntityList.contains(entityType) && !ReindexingUtil.isDataInsightIndex(entityType)) {
                  throw new IllegalArgumentException(
                      String.format("Entity Type : %s is not a valid Entity", entityType));
                }
              });
    } else {
      throw new IllegalArgumentException("Entities cannot be Empty");
    }
  }

  public void removeCompletedJob(UUID jobId) {
    REINDEXING_JOB_MAP.remove(jobId);
  }

  public EventPublisherJob getJob(UUID jobId) throws IOException {
    SearchIndexWorkflow job = REINDEXING_JOB_MAP.get(jobId);
    if (job == null) {
      String recordString =
          dao.entityExtensionTimeSeriesDao().getLatestExtension(jobId.toString(), REINDEXING_JOB_EXTENSION);
      return JsonUtils.readValue(recordString, EventPublisherJob.class);
    }
    return REINDEXING_JOB_MAP.get(jobId).getJobData();
  }

  public EventPublisherJob getLatestJob() throws IOException {
    List<SearchIndexWorkflow> activeJobs = new ArrayList<>(REINDEXING_JOB_MAP.values());
    if (!activeJobs.isEmpty()) {
      return activeJobs.get(activeJobs.size() - 1).getJobData();
    } else {
      String recordString = dao.entityExtensionTimeSeriesDao().getLatestByExtension(REINDEXING_JOB_EXTENSION);
      return JsonUtils.readValue(recordString, EventPublisherJob.class);
    }
  }

  public List<EventPublisherJob> getAllJobs() throws IOException {
    List<EventPublisherJob> result = new ArrayList<>();
    List<SearchIndexWorkflow> activeReindexingJob = new ArrayList<>(REINDEXING_JOB_MAP.values());
    List<EventPublisherJob> activeEventPubJob =
        activeReindexingJob.stream().map(SearchIndexWorkflow::getJobData).collect(Collectors.toList());
    List<EventPublisherJob> jobsFromDatabase =
        JsonUtils.readObjects(
            dao.entityExtensionTimeSeriesDao().getAllByExtension(REINDEXING_JOB_EXTENSION), EventPublisherJob.class);
    jobsFromDatabase.removeIf(
        job -> {
          for (EventPublisherJob active : activeEventPubJob) {
            if (active.getId().equals(job.getId())) {
              return true;
            }
          }
          return false;
        });
    result.addAll(activeEventPubJob);
    result.addAll(jobsFromDatabase);
    return result;
  }

  private EventPublisherJob getReindexJob(String startedBy, CreateEventPublisherJob job) {
    long updateTime = Date.from(LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant()).getTime();
    return new EventPublisherJob()
        .withId(UUID.randomUUID())
        .withName(job.getName())
        .withPublisherType(CreateEventPublisherJob.PublisherType.ELASTIC_SEARCH)
        .withRunMode(CreateEventPublisherJob.RunMode.BATCH)
        .withStartedBy(startedBy)
        .withStatus(EventPublisherJob.Status.STARTED)
        .withStats(new Stats())
        .withStartTime(updateTime)
        .withTimestamp(updateTime)
        .withEntities(job.getEntities())
        .withBatchSize(job.getBatchSize())
        .withFailure(new Failure())
        .withRecreateIndex(job.getRecreateIndex())
        .withSearchIndexMappingLanguage(job.getSearchIndexMappingLanguage())
        .withAfterCursor(job.getAfterCursor());
  }
}
