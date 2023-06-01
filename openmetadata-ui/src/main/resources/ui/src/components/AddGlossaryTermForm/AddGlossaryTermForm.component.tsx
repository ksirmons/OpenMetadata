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
import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, FormProps, Input, Row, Space, Spin } from 'antd';
import { UserTag } from 'components/common/UserTag/UserTag.component';
import { UserTagSize } from 'components/common/UserTag/UserTag.interface';
import { PAGE_SIZE } from 'constants/constants';
import { ENTITY_NAME_REGEX } from 'constants/regex.constants';
import { SearchIndex } from 'enums/search.enum';
import { t } from 'i18next';
import { FieldProp, FieldTypes } from 'interface/FormUtils.interface';
import { debounce } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { searchData } from 'rest/miscAPI';
import { formatSearchGlossaryTermResponse } from 'utils/APIUtils';
import { getEntityName } from 'utils/EntityUtils';
import { generateFormFields, getField } from 'utils/formUtils';
import {
  formatRelatedTermOptions,
  getEntityReferenceFromGlossaryTerm,
} from 'utils/GlossaryUtils';
import { EntityReference } from '../../generated/type/entityReference';
import { getCurrentUserId } from '../../utils/CommonUtils';
import { AddGlossaryTermFormProps } from './AddGlossaryTermForm.interface';
import { ReactComponent as DeleteIcon } from '/assets/svg/ic-delete.svg';

const AddGlossaryTermForm = ({
  editMode,
  onSave,
  onCancel,
  isLoading,
  glossaryReviewers = [],
  glossaryTerm,
  isFormInModal = false,
  formRef: form,
}: AddGlossaryTermFormProps) => {
  const [reviewer, setReviewer] = useState<Array<EntityReference>>([]);
  const [relatedTerms, setRelatedTerms] = useState<EntityReference[]>([]);
  const [owner, setOwner] = useState<EntityReference | undefined>();
  const [isSuggestionLoading, setIsSuggestionLoading] =
    useState<boolean>(false);
  const [relatedTermsOptions, setRelatedTermsOptions] =
    useState<EntityReference[]>();
  const selectedOwner = Form.useWatch<EntityReference | undefined>(
    'owner',
    form
  );
  const reviewersList =
    Form.useWatch<EntityReference[]>('reviewers', form) ?? [];

  const suggestionSearch = useCallback(
    (searchText = '') => {
      setIsSuggestionLoading(true);
      searchData(searchText, 1, PAGE_SIZE, '', '', '', SearchIndex.GLOSSARY)
        .then((res) => {
          let termResult = formatSearchGlossaryTermResponse(res.data.hits.hits);
          if (editMode && glossaryTerm) {
            termResult = termResult.filter((item) => {
              return (
                item.fullyQualifiedName !== glossaryTerm.fullyQualifiedName
              );
            });
          }
          const results = termResult.map(getEntityReferenceFromGlossaryTerm);
          setRelatedTermsOptions(results);
        })
        .catch(() => {
          setRelatedTermsOptions([]);
        })
        .finally(() => setIsSuggestionLoading(false));
    },
    [glossaryTerm]
  );

  const debounceOnSearch = useCallback(debounce(suggestionSearch, 250), []);

  const handleSave: FormProps['onFinish'] = (formObj) => {
    const {
      name,
      displayName = '',
      description = '',
      synonyms = [],
      tags = [],
      mutuallyExclusive = false,
      references = [],
    } = formObj;

    const selectedOwner = owner || {
      id: getCurrentUserId(),
      type: 'user',
    };

    const updatedTerms = editMode
      ? relatedTerms.map((term) => term.id || '')
      : relatedTerms.map((term) => term.fullyQualifiedName || '');

    const data = {
      name: name.trim(),
      displayName: displayName?.trim(),
      description: description,
      reviewers: reviewer,
      relatedTerms: updatedTerms.length > 0 ? updatedTerms : undefined,
      references: references.length > 0 ? references : undefined,
      synonyms: synonyms,
      mutuallyExclusive,
      tags: tags,
      owner: selectedOwner,
    };
    onSave(data);
  };

  useEffect(() => {
    if (glossaryReviewers.length > 0) {
      setReviewer(glossaryReviewers);
    }
    if (editMode && glossaryTerm) {
      const {
        name,
        displayName,
        description,
        synonyms,
        tags,
        references,
        mutuallyExclusive,
        reviewers,
        owner,
        relatedTerms,
      } = glossaryTerm;

      form.setFieldsValue({
        name,
        displayName,
        description,
        synonyms,
        tags,
        references,
        mutuallyExclusive,
        relatedTerms: relatedTerms?.map((r) => r.id || ''),
      });

      if (reviewers) {
        setReviewer(reviewers);
      }

      if (owner) {
        setOwner(owner);
      }

      if (relatedTerms && relatedTerms.length > 0) {
        setRelatedTerms(relatedTerms);
        setRelatedTermsOptions(relatedTerms);
      }
    }
  }, [editMode, glossaryTerm, glossaryReviewers, form]);

  const formFields: FieldProp[] = [
    {
      name: 'name',
      id: 'root/name',
      label: t('label.name'),
      required: true,
      placeholder: t('label.name'),
      type: FieldTypes.TEXT,
      props: {
        'data-testid': 'name',
      },
      rules: [
        {
          pattern: ENTITY_NAME_REGEX,
          message: t('message.entity-name-validation'),
        },
        {
          min: 1,
          max: 128,
          message: `${t('message.entity-maximum-size', {
            entity: `${t('label.name')}`,
            max: '128',
          })}`,
        },
      ],
    },
    {
      name: 'displayName',
      id: 'root/displayName',
      label: t('label.display-name'),
      required: false,
      placeholder: t('label.display-name'),
      type: FieldTypes.TEXT,
      props: {
        'data-testid': 'display-name',
      },
    },
    {
      name: 'description',
      required: true,
      label: t('label.description'),
      id: 'root/description',
      type: FieldTypes.DESCRIPTION,
      props: {
        'data-testid': 'description',
        initialValue: '',
        height: '170px',
      },
    },
    {
      name: 'tags',
      required: false,
      label: t('label.tag-plural'),
      id: 'root/tags',
      type: FieldTypes.TAG_SUGGESTION,
      props: {
        'data-testid': 'tags-container',
      },
    },
    {
      name: 'synonyms',
      required: false,
      label: t('label.synonym-plural'),
      id: 'root/synonyms',
      type: FieldTypes.SELECT,
      props: {
        className: 'glossary-select',
        'data-testid': 'synonyms',
        mode: 'tags',
        placeholder: t('message.synonym-placeholder'),
        open: false,
      },
    },
    {
      name: 'relatedTerms',
      required: false,
      label: t('label.related-term-plural'),
      id: 'root/relatedTerms',
      type: FieldTypes.SELECT,
      props: {
        className: 'glossary-select',
        'data-testid': 'related-terms',
        mode: 'multiple',
        placeholder: t('label.add-entity', {
          entity: t('label.related-term-plural'),
        }),
        notFoundContent: isSuggestionLoading ? <Spin size="small" /> : null,
        filterOption: false,
        options: formatRelatedTermOptions(relatedTermsOptions),
        onFocus: suggestionSearch,
        onSearch: debounceOnSearch,
      },
    },
    {
      name: 'mutuallyExclusive',
      label: t('label.mutually-exclusive'),
      type: FieldTypes.SWITCH,
      required: false,
      props: {
        'data-testid': 'mutually-exclusive-button',
      },
      id: 'root/mutuallyExclusive',
      formItemLayout: 'horizontal',
    },
  ];

  const ownerField: FieldProp = {
    name: 'owner',
    id: 'root/owner',
    required: false,
    label: t('label.owner'),
    type: FieldTypes.USER_TEAM_SELECT,
    props: {
      hasPermission: true,
      children: (
        <Button
          data-testid="add-owner"
          icon={<PlusOutlined style={{ color: 'white', fontSize: '12px' }} />}
          size="small"
          type="primary"
        />
      ),
    },
    formItemLayout: 'horizontal',
    formItemProps: {
      valuePropName: 'owner',
      trigger: 'onUpdate',
    },
  };

  const reviewersField: FieldProp = {
    name: 'reviewers',
    id: 'root/reviewers',
    required: false,
    label: t('label.reviewer-plural'),
    type: FieldTypes.USER_MULTI_SELECT,
    props: {
      hasPermission: true,
      popoverProps: { placement: 'topLeft' },
      children: (
        <Button
          data-testid="add-reviewers"
          icon={<PlusOutlined style={{ color: 'white', fontSize: '12px' }} />}
          size="small"
          type="primary"
        />
      ),
    },
    formItemLayout: 'horizontal',
    formItemProps: {
      valuePropName: 'selectedUsers',
      trigger: 'onUpdate',
      initialValue: [],
    },
  };

  return (
    <>
      <Form
        form={form}
        initialValues={{
          description: editMode && glossaryTerm ? glossaryTerm.description : '',
        }}
        layout="vertical"
        onFinish={handleSave}>
        {generateFormFields(formFields)}

        <Form.List name="references">
          {(fields, { add, remove }) => (
            <>
              <Form.Item
                className="form-item-horizontal"
                colon={false}
                label={t('label.reference-plural')}>
                <Button
                  data-testid="add-reference"
                  icon={
                    <PlusOutlined
                      style={{ color: 'white', fontSize: '12px' }}
                    />
                  }
                  size="small"
                  type="primary"
                  onClick={() => {
                    add();
                  }}
                />
              </Form.Item>

              {fields.map((field, index) => (
                <Row gutter={[8, 0]} key={field.key}>
                  <Col span={11}>
                    <Form.Item
                      name={[field.name, 'name']}
                      rules={[
                        {
                          required: true,
                          message: `${t('message.field-text-is-required', {
                            fieldText: t('label.name'),
                          })}`,
                        },
                      ]}>
                      <Input
                        id={`name-${index}`}
                        placeholder={t('label.name')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={11}>
                    <Form.Item
                      name={[field.name, 'endpoint']}
                      rules={[
                        {
                          required: true,
                          message: t('message.valid-url-endpoint'),
                          type: 'url',
                        },
                      ]}>
                      <Input
                        id={`url-${index}`}
                        placeholder={t('label.endpoint')}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <Button
                      icon={<DeleteIcon width={16} />}
                      size="small"
                      type="text"
                      onClick={() => {
                        remove(field.name);
                      }}
                    />
                  </Col>
                </Row>
              ))}
            </>
          )}
        </Form.List>

        <div className="m-t-xss">
          {getField(ownerField)}
          {selectedOwner && (
            <div className="tw-my-2" data-testid="owner-container">
              <UserTag
                id={selectedOwner.id}
                name={getEntityName(selectedOwner)}
                size={UserTagSize.small}
              />
            </div>
          )}
        </div>
        <div className="m-t-xss">
          {getField(reviewersField)}
          {Boolean(reviewersList.length) && (
            <Space
              wrap
              className="tw-my-2"
              data-testid="reviewers-container"
              size={[8, 8]}>
              {reviewersList.map((d) => (
                <UserTag
                  id={d.id}
                  key={d.id}
                  name={getEntityName(d)}
                  size={UserTagSize.small}
                />
              ))}
            </Space>
          )}
        </div>

        {!isFormInModal && (
          <Form.Item>
            <Space
              className="w-full justify-end"
              data-testid="cta-buttons"
              size={16}>
              <Button
                data-testid="cancel-glossary-term"
                type="link"
                onClick={onCancel}>
                {t('label.cancel')}
              </Button>
              <Button
                data-testid="save-glossary-term"
                htmlType="submit"
                loading={isLoading}
                type="primary">
                {t('label.save')}
              </Button>
            </Space>
          </Form.Item>
        )}
      </Form>
    </>
  );
};

export default AddGlossaryTermForm;
