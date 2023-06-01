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

import { FQN_SEPARATOR_CHAR } from './char.constants';

export const UrlEntityCharRegEx = /[#.%;?/\\]/g;
export const validEmailRegEx = /^\S+@\S+\.\S+$/;
export const FQN_REGEX = new RegExp(
  `("${FQN_SEPARATOR_CHAR}*?"|[^"${FQN_SEPARATOR_CHAR}\\s]+)(?=\\s*.|\\s*$)`,
  'g'
);

export const ENTITY_NAME_REGEX = /^[\w\- .'&()]+$/;

export const delimiterRegex = /[\\[\]\\()\\;\\,\\|\\{}\\``\\/\\<>\\^]/g;
export const nameWithSpace = /\s/g;

export const passwordRegex =
  /^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,16}$/g;

export const allowedNameRegEx = /[`!@#$%^&*()+=[\]{};:"\\|,.<>/?~]/;

export const ONEOF_ANYOF_ALLOF_REGEX = /(oneof|anyof|allof)/;

export const markdownTextAndIdRegex = /^(\S.*?)\s*\$\(id="(.*?)"\)/;
export const MARKDOWN_MATCH_ID = /\$\(id="(.*?)"\)/;

export const CUSTOM_PROPERTY_NAME_REGEX = /^[a-z][a-zA-Z0-9]*$/;

export const ENDS_WITH_NUMBER_REGEX = /\d+$/;
