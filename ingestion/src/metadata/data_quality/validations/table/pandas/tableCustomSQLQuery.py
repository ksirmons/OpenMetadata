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
Validator for table custom SQL Query test case
"""

from metadata.data_quality.validations.mixins.pandas_validator_mixin import (
    PandasValidatorMixin,
)
from metadata.data_quality.validations.table.base.tableCustomSQLQuery import (
    BaseTableCustomSQLQueryValidator,
)
from metadata.utils.logger import test_suite_logger

logger = test_suite_logger()


class TableCustomSQLQueryValidator(
    BaseTableCustomSQLQueryValidator, PandasValidatorMixin
):
    """Validator for table custom SQL Query test case"""

    def _run_results(self, sql_expression: str):
        """compute result of the test case"""
        import pandas as pd  # pylint: disable=import-outside-toplevel

        try:
            return pd.concat(runner.query(sql_expression) for runner in self.runner)
        except MemoryError:
            logger.error(
                "Unable to compute due to memory constraints."
                "We recommend using a smaller sample size or partitionning for the query."
            )
            return []
