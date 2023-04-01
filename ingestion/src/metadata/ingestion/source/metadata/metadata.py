#  Copyright 2021 Collate
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#  http://www.apache.org/licenses/LICENSE-2.0
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
"""Metadata source module"""
import traceback
from typing import Iterable

from metadata.generated.schema.entity.classification.classification import (
    Classification,
)
from metadata.generated.schema.entity.data.container import Container
from metadata.generated.schema.entity.data.dashboard import Dashboard
from metadata.generated.schema.entity.data.glossary import Glossary
from metadata.generated.schema.entity.data.glossaryTerm import GlossaryTerm
from metadata.generated.schema.entity.data.mlmodel import MlModel
from metadata.generated.schema.entity.data.pipeline import Pipeline
from metadata.generated.schema.entity.data.query import Query
from metadata.generated.schema.entity.data.table import Table
from metadata.generated.schema.entity.data.topic import Topic
from metadata.generated.schema.entity.policies.policy import Policy
from metadata.generated.schema.entity.services.connections.metadata.metadataESConnection import (
    MetadataESConnection,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.generated.schema.entity.services.databaseService import DatabaseService
from metadata.generated.schema.entity.services.messagingService import MessagingService
from metadata.generated.schema.entity.services.objectstoreService import (
    ObjectStoreService,
)
from metadata.generated.schema.entity.services.pipelineService import PipelineService
from metadata.generated.schema.entity.teams.team import Team
from metadata.generated.schema.entity.teams.user import User
from metadata.generated.schema.metadataIngestion.workflow import (
    Source as WorkflowSource,
)
from metadata.ingestion.api.common import Entity
from metadata.ingestion.api.source import Source
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.utils.logger import ingestion_logger

logger = ingestion_logger()


class MetadataSource(Source[Entity]):
    """
    Metadata Source to Fetch All Entities from backend
    """

    config: WorkflowSource

    def __init__(
        self,
        config: WorkflowSource,
        metadata_config: OpenMetadataConnection,
    ):
        super().__init__()
        self.config = config
        self.metadata_config = metadata_config
        self.metadata = OpenMetadata(metadata_config)
        self.service_connection: MetadataESConnection = (
            config.serviceConnection.__root__.config
        )
        self.wrote_something = False
        self.tables = None
        self.topics = None

    def prepare(self):
        pass

    @classmethod
    def create(cls, config_dict, metadata_config: OpenMetadataConnection):
        raise NotImplementedError("Create Method not implemented")

    def next_record(self) -> Iterable[Entity]:  # pylint: disable=too-many-branches
        if self.service_connection.includeTables:
            yield from self.fetch_entities(
                entity_class=Table,
                fields=[
                    "columns",
                    "tableConstraints",
                    "usageSummary",
                    "owner",
                    "tags",
                    "followers",
                ],
            )
        if self.service_connection.includeTopics:
            yield from self.fetch_entities(
                entity_class=Topic,
                fields=["owner", "tags", "followers"],
            )
        if self.service_connection.includeDashboards:
            yield from self.fetch_entities(
                entity_class=Dashboard,
                fields=[
                    "owner",
                    "tags",
                    "followers",
                    "charts",
                    "usageSummary",
                ],
            )

        if self.service_connection.includePipelines:
            yield from self.fetch_entities(
                entity_class=Pipeline,
                fields=["owner", "tags", "followers", "tasks"],
            )
        if self.service_connection.includeMlModels:
            yield from self.fetch_entities(
                entity_class=MlModel,
                fields=["owner", "tags", "followers"],
            )
        if self.service_connection.includeUsers:
            yield from self.fetch_entities(
                entity_class=User,
                fields=["teams", "roles"],
            )

        if self.service_connection.includeTeams:
            yield from self.fetch_entities(
                entity_class=Team,
                fields=["users", "owns", "parents"],
            )

        if self.service_connection.includeGlossaryTerms:
            yield from self.fetch_entities(
                entity_class=GlossaryTerm,
                fields=[],
            )
            yield from self.fetch_entities(
                entity_class=Glossary,
                fields=["owner", "tags", "reviewers", "usageCount"],
            )

        if self.service_connection.includePolicy:
            yield from self.fetch_entities(
                entity_class=Policy,
                fields=[],
            )
        if self.service_connection.includeTags:
            yield from self.fetch_entities(
                entity_class=Classification,
                fields=[],
            )

        if self.service_connection.includeMessagingServices:
            yield from self.fetch_entities(
                entity_class=MessagingService,
                fields=["owner"],
            )

        if self.service_connection.includeDatabaseServices:
            yield from self.fetch_entities(
                entity_class=DatabaseService,
                fields=["owner"],
            )

        if self.service_connection.includePipelineServices:
            yield from self.fetch_entities(
                entity_class=PipelineService,
                fields=["owner"],
            )

        if self.service_connection.includeContainers:
            yield from self.fetch_entities(
                entity_class=Container,
                fields=["owner"],
            )

        if self.service_connection.includeStorageServices:
            yield from self.fetch_entities(
                entity_class=ObjectStoreService,
                fields=["owner"],
            )

        if self.service_connection.includeQueries:
            yield from self.fetch_entities(
                entity_class=Query,
                fields=["owner"],
            )

    def fetch_entities(self, entity_class, fields):
        """
        Args:
            entity_class: class of the entities to be fetched
            fields: fields that must be additionally fetched

        Returns:
            A list of entities with the requested fields
        """
        try:
            after = None
            while True:
                entities_list = self.metadata.list_entities(
                    entity=entity_class,
                    fields=fields,
                    after=after,
                    limit=self.service_connection.limitRecords,
                )
                for entity in entities_list.entities:
                    self.status.scanned(
                        f"{entity_class.__name__} Scanned {entity.name}"
                    )
                    yield entity
                if entities_list.after is None:
                    break
                after = entities_list.after

        except Exception as exc:
            logger.debug(traceback.format_exc())
            logger.error(
                f"Fetching entities failed for [{entity_class.__name__}]: {exc}"
            )

    def close(self):
        pass

    def test_connection(self) -> None:
        pass
