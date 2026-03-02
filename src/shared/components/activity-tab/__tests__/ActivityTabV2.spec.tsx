import * as React from 'react';
import { MemoryRouter, useParams } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ActivityTabV2 from '../ActivityTabV2';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: jest.fn(),
  };
});

jest.mock('~/components/DetailsPage', () => ({
  DetailsSection: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid="details-section">
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

jest.mock('~/components/Commits/CommitsListPage/CommitsListViewV2', () => ({
  __esModule: true,
  default: () => <div data-testid="commits-list-v2">Commits List V2</div>,
}));

jest.mock('~/components/PipelineRun/PipelineRunListView/PipelineRunsListViewV2', () => ({
  __esModule: true,
  default: () => <div data-testid="pipeline-runs-list-v2">Pipeline Runs List V2</div>,
}));

jest.mock('~/components/Filter/generic/FilterContext', () => ({
  FilterContextProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('~/shared/hooks/useLocalStorage', () => ({
  useLocalStorage: () => ['latest-commits', jest.fn()],
}));

jest.mock('~/shared/providers/Namespace/useNamespaceInfo', () => ({
  useNamespace: () => 'test-ns',
}));

const useParamsMock = useParams as jest.Mock;

const renderActivityTabV2 = () =>
  render(
    <MemoryRouter>
      <ActivityTabV2 />
    </MemoryRouter>,
  );

describe('ActivityTabV2', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({
      workspaceName: 'test-ns',
      componentName: 'my-component',
      versionRevision: undefined,
      activityTab: 'latest-commits',
    });
  });

  it('renders Activity section with Commits and Pipeline runs tabs', () => {
    renderActivityTabV2();
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByText('Latest commits')).toBeInTheDocument();
    expect(screen.getByText('Pipeline runs')).toBeInTheDocument();
  });

  it('shows Commits list when on commits tab', () => {
    renderActivityTabV2();
    expect(screen.getByText('Commits List V2')).toBeInTheDocument();
  });

  it('shows missing component message when componentName is missing', () => {
    useParamsMock.mockReturnValue({
      workspaceName: 'test-ns',
      componentName: undefined,
    });
    renderActivityTabV2();
    expect(screen.getByText('Missing component name.')).toBeInTheDocument();
  });
});
