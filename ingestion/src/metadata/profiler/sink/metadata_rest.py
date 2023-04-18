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

"""
OpenMetadata REST Sink implementation for the ORM Profiler results
"""
import traceback
from typing import Optional

from metadata.config.common import ConfigModel
from metadata.generated.schema.api.data.createTableProfile import (
    CreateTableProfileRequest,
)
from metadata.generated.schema.entity.services.connections.metadata.openMetadataConnection import (
    OpenMetadataConnection,
)
from metadata.ingestion.api.common import Entity
from metadata.ingestion.api.sink import Sink
from metadata.ingestion.ometa.client import APIError
from metadata.ingestion.ometa.ometa_api import OpenMetadata
from metadata.profiler.api.models import ProfilerResponse
from metadata.utils.logger import profiler_logger

logger = profiler_logger()


class MetadataRestSinkConfig(ConfigModel):
    api_endpoint: Optional[str] = None


class MetadataRestSink(Sink[Entity]):
    """
    Metadata Sink sending the profiler
    and tests results to the OM API
    """

    config: MetadataRestSinkConfig

    def __init__(
        self,
        config: MetadataRestSinkConfig,
        metadata_config: OpenMetadataConnection,
    ):
        super().__init__()
        self.config = config
        self.metadata_config = metadata_config
        self.wrote_something = False
        self.metadata = OpenMetadata(self.metadata_config)

    @classmethod
    def create(cls, config_dict: dict, metadata_config: OpenMetadataConnection):
        config = MetadataRestSinkConfig.parse_obj(config_dict)
        return cls(config, metadata_config)

    @staticmethod
    def clean_up_profile_columns(
        profile: CreateTableProfileRequest,
    ) -> CreateTableProfileRequest:
        """clean up "`" character used for BQ array

        Args:
            profile (CreateTableProfileRequest): profiler request

        Returns:
            CreateTableProfileRequest: profiler request modified
        """
        column_profile = profile.columnProfile
        for column in column_profile:
            column.name = column.name.replace("`", "")

        profile.columnProfile = column_profile
        return profile

    def close(self) -> None:
        self.metadata.close()

    def write_record(self, record: ProfilerResponse) -> None:
        try:
            self.metadata.ingest_profile_data(
                table=record.table,
                profile_request=self.clean_up_profile_columns(record.profile),
            )
            logger.info(
                f"Successfully ingested profile metrics for {record.table.fullyQualifiedName.__root__}"
            )

            if record.sample_data:
                self.metadata.ingest_table_sample_data(
                    table=record.table, sample_data=record.sample_data
                )
                logger.info(
                    f"Successfully ingested sample data for {record.table.fullyQualifiedName.__root__}"
                )
            self.status.records_written(
                f"Table: {record.table.fullyQualifiedName.__root__}"
            )

        except APIError as err:
            name = record.table.fullyQualifiedName.__root__
            error = f"Failed to sink profiler & test data for {name}: {err}"
            logger.debug(traceback.format_exc())
            logger.warning(error)
            self.status.failed(name, error, traceback.format_exc())
