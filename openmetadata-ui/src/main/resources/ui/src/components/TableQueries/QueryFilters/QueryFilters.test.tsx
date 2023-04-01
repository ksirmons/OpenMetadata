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
import React from 'react';
import QueryFilters from './QueryFilters.component';

const mockOnFilterChange = jest.fn();
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn().mockImplementation(() => ({ search: '' })),
}));
jest.mock('components/SearchDropdown/SearchDropdown', () => {
  return jest.fn().mockImplementation(() => <div>SearchDropdown</div>);
});
jest.mock('rest/miscAPI', () => ({
  ...jest.requireActual('rest/miscAPI'),
  getSearchedTeams: jest.fn().mockImplementation(() => Promise.resolve()),
  getSearchedUsers: jest.fn().mockImplementation(() => Promise.resolve()),
}));

describe('QueryFilters component test', () => {
  it('Component should render', async () => {
    render(<QueryFilters onFilterChange={mockOnFilterChange} />);

    expect(await screen.findAllByText('SearchDropdown')).toHaveLength(2);
  });
});
