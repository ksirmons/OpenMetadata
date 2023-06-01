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

import { render, screen } from '@testing-library/react';
import { Constraint, DataType } from 'generated/entity/data/table';
import { LabelType, State, TagSource } from 'generated/type/schema';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import TableTags from './TableTags.component';

jest.mock('components/Tag/TagsViewer/tags-viewer', () => {
  return jest.fn().mockReturnValue(<p data-testid="tags-viewer">TagViewer</p>);
});

jest.mock('utils/FeedElementUtils', () => ({
  getFieldThreadElement: jest
    .fn()
    .mockReturnValue(
      <p data-testid="field-thread-element">FieldThreadElement</p>
    ),
}));

const glossaryTags = [
  {
    tagFQN: 'glossary.term1',
    description: 'this is test',
    source: TagSource.Glossary,
    labelType: LabelType.Manual,
    state: State.Suggested,
  },
  {
    tagFQN: 'glossary.term3',
    description: 'this is term3',
    source: TagSource.Glossary,
    labelType: LabelType.Manual,
    state: State.Suggested,
  },
];

const classificationTags = [
  {
    tagFQN: 'PersonalData.Personal',
    description:
      'Data that can be used to directly or indirectly identify a person.',
    source: TagSource.Classification,
    labelType: LabelType.Manual,
    state: State.Suggested,
  },
];

const requestUpdateTags = {
  onUpdateTagsHandler: jest.fn(),
  onRequestTagsHandler: jest.fn(),
  getColumnName: jest.fn(),
  getColumnFieldFQN: 'columns::product_id::tags',
};

const mockProp = {
  placeholder: 'Search Tags',
  dataTestId: 'tag-container',
  tags: {
    Classification: [],
    Glossary: [],
  },
  record: {
    constraint: Constraint.Null,
    dataLength: 1,
    dataType: DataType.String,
    dataTypeDisplay: 'string',
    description: '',
    fullyQualifiedName:
      'sample_data.ecommerce_db.shopify.raw_customer.comments',
    key: 'comments',
    name: 'comments',
    ordinalPosition: 1,
    subRows: undefined,
    tags: [],
  },
  index: 0,
  isReadOnly: false,
  isTagLoading: false,
  hasTagEditAccess: true,
  entityFieldTasks: [],
  onThreadLinkSelect: jest.fn(),
  entityFieldThreads: [
    {
      entityLink:
        '<#E::table::sample_data.ecommerce_db.shopify.raw_customer::columns::comments::tags>',
      count: 4,
      entityField: 'columns::comments::tags',
    },
  ],
  entityFqn: 'sample_data.ecommerce_db.shopify.raw_customer',
  tagList: [],
  handleTagSelection: jest.fn(),
  type: TagSource.Classification,
  fetchTags: jest.fn(),
  tagFetchFailed: false,
};

describe('Test EntityTableTags Component', () => {
  it('Initially, Tags Container should load', async () => {
    render(<TableTags {...mockProp} />, {
      wrapper: MemoryRouter,
    });

    const tagContainer = await screen.findByTestId('tag-container-0');

    expect(tagContainer).toBeInTheDocument();
  });

  it('Tags Viewer should be visible for non-admin', async () => {
    render(
      <TableTags
        {...mockProp}
        isReadOnly
        record={{
          ...mockProp.record,
          tags: [...classificationTags, ...glossaryTags],
        }}
        tags={{
          Classification: classificationTags,
          Glossary: glossaryTags,
        }}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const tagContainer = await screen.findByTestId('tag-container-0');
    const tagViewer = await screen.findByTestId('tags-viewer');

    expect(tagContainer).toBeInTheDocument();
    expect(tagViewer).toBeInTheDocument();
  });

  it('Tags list should be visible', async () => {
    render(
      <TableTags
        {...mockProp}
        record={{
          ...mockProp.record,
          tags: [...classificationTags, ...glossaryTags],
        }}
        tags={{
          Classification: classificationTags,
          Glossary: glossaryTags,
        }}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const tagContainer = await screen.findByTestId('tag-container-0');
    const tagPersonal = await screen.findByTestId('tag-PersonalData.Personal');

    expect(tagContainer).toBeInTheDocument();
    expect(tagPersonal).toBeInTheDocument();
  });

  it('Should not render update and request tags buttons', async () => {
    render(
      <TableTags
        {...mockProp}
        record={{
          ...mockProp.record,
          tags: [...classificationTags, ...glossaryTags],
        }}
        tags={{
          Classification: classificationTags,
          Glossary: glossaryTags,
        }}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const tagContainer = await screen.findByTestId('tag-container-0');
    const requestTags = screen.queryByTestId('field-thread-element');

    expect(tagContainer).toBeInTheDocument();
    expect(requestTags).not.toBeInTheDocument();
  });

  it('Should render update and request tags buttons', async () => {
    render(
      <TableTags
        {...mockProp}
        {...requestUpdateTags}
        record={{
          ...mockProp.record,
          tags: [...classificationTags, ...glossaryTags],
        }}
        tags={{
          Classification: classificationTags,
          Glossary: glossaryTags,
        }}
      />,
      {
        wrapper: MemoryRouter,
      }
    );

    const tagContainer = await screen.findByTestId('tag-container-0');
    const requestTags = await screen.findAllByTestId('field-thread-element');

    expect(tagContainer).toBeInTheDocument();
    expect(requestTags).toHaveLength(2);
  });
});
