#  Copyright 2022 Collate
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
MSSQL E2E tests
"""

from typing import List

import pytest
import yaml

from metadata.generated.schema.entity.data.table import Histogram

from .common.test_cli_db import CliCommonDB
from .common_e2e_sqa_mixins import SQACommonMethods


class MSSQLCliTest(CliCommonDB.TestSuite, SQACommonMethods):
    create_table_query: str = """
        CREATE TABLE e2e_cli_tests.dbo.persons (
            person_id int,
            full_name varchar(255),
            birthdate date
        )
    """

    create_view_query: str = """
        CREATE VIEW view_persons AS
            SELECT *
            FROM e2e_cli_tests.dbo.persons;
    """

    insert_data_queries: List[str] = [
        """
    INSERT INTO persons (person_id, full_name, birthdate) VALUES
        (1,'Peter Parker', '2004-08-10'),
        (2,'Bruce Banner', '1988-12-18'),
        (3,'Steve Rogers', '1988-07-04'),
        (4,'Natasha Romanoff', '1997-12-03'),
        (5,'Wanda Maximoff', '1998-02-10'),
        (6,'Diana Prince', '1976-03-17');
    """
    ]

    drop_table_query: str = """
        DROP TABLE IF EXISTS e2e_cli_tests.dbo.persons;
    """

    drop_view_query: str = """
        DROP VIEW  IF EXISTS view_persons;
    """

    def setUp(self) -> None:
        self.create_table_and_view()

    def tearDown(self) -> None:
        self.delete_table_and_view()

    @staticmethod
    def get_connector_name() -> str:
        return "mssql"

    def create_table_and_view(self) -> None:
        SQACommonMethods.create_table_and_view(self)

    def delete_table_and_view(self) -> None:
        SQACommonMethods.delete_table_and_view(self)

    @staticmethod
    def expected_tables() -> int:
        return 1

    def inserted_rows_count(self) -> int:
        return 6

    def view_column_lineage_count(self) -> int:
        return 3

    @staticmethod
    def fqn_created_table() -> str:
        return "mssql.e2e_cli_tests.dbo.persons"

    @staticmethod
    def get_profiler_time_partition() -> dict:
        return {
            "fullyQualifiedName": "mssql.e2e_cli_tests.dbo.persons",
            "partitionConfig": {
                "enablePartitioning": True,
                "partitionColumnName": "birthdate",
                "partitionIntervalType": "TIME-UNIT",
                "partitionInterval": 30,
                "partitionIntervalUnit": "YEAR",
            },
        }

    @staticmethod
    def get_includes_schemas() -> List[str]:
        return ["dbo"]

    @staticmethod
    def get_includes_tables() -> List[str]:
        return ["persons"]

    @staticmethod
    def get_excludes_tables() -> List[str]:
        return ["foo"]

    @staticmethod
    def expected_filtered_schema_includes() -> int:
        return 12

    @staticmethod
    def expected_filtered_schema_excludes() -> int:
        return 1

    @staticmethod
    def expected_filtered_table_includes() -> int:
        return 2

    @staticmethod
    def expected_filtered_table_excludes() -> int:
        return 1

    @staticmethod
    def expected_filtered_mix() -> int:
        return 14

    @staticmethod
    def get_profiler_time_partition_results() -> dict:
        return {
            "table_profile": {
                "columnCount": 3.0,
                "rowCount": 3.0,
            },
            "column_profile": [
                {
                    "person_id": {
                        "distinctCount": 3.0,
                        "distinctProportion": 1.0,
                        "duplicateCount": None,
                        "firstQuartile": 2.1999999999999997,
                        "histogram": Histogram(
                            boundaries=["1.00 to 4.33", "4.33 and up"],
                            frequencies=[2, 1],
                        ),
                        "interQuartileRange": 2.4,
                        "max": 5.0,
                        "maxLength": None,
                        "mean": 3.333333,
                        "median": 4.0,
                        "min": 1.0,
                        "minLength": None,
                        "missingCount": None,
                        "missingPercentage": None,
                        "nonParametricSkew": -0.3922324663925032,
                        "nullCount": 0.0,
                        "nullProportion": 0.0,
                        "stddev": 1.6996731711975948,
                        "sum": 10.0,
                        "thirdQuartile": 4.6,
                        "uniqueCount": 3.0,
                        "uniqueProportion": 1.0,
                        "validCount": None,
                        "valuesCount": 3.0,
                        "valuesPercentage": None,
                        "variance": None,
                    }
                }
            ],
        }
