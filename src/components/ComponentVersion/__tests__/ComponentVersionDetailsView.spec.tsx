import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useApplicationBreadcrumbs } from '~/components/Applications/breadcrumbs/breadcrumb-utils';
import { useComponent } from '~/hooks/useComponents';
import { ComponentKind, ComponentSpecs } from '~/types';
import { renderWithQueryClientAndRouter, mockUseNamespaceHook } from '~/unit-test-utils';
import ComponentVersionDetailsView from '../ComponentVersionDetailsView';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  Outlet: () => <div data-test="outlet" />,
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/components/Applications/breadcrumbs/breadcrumb-utils', () => ({
  useApplicationBreadcrumbs: jest.fn(),
}));

const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const useApplicationBreadcrumbsMock = useApplicationBreadcrumbs as jest.Mock;

const mockComponent: Partial<ComponentKind> = {
  metadata: {
    name: 'my-component',
    namespace: 'test-ns',
    uid: 'uid-1',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {
    componentName: 'my-component',
    application: 'my-app',
    source: {
      url: 'https://github.com/org/repo',
      versions: [
        { name: 'Version 1.0', revision: 'ver-1.0', context: './frontend' },
        { name: 'Main', revision: 'main' },
      ],
    },
    containerImage: 'quay.io/org/repo',
  } as ComponentSpecs,
};

describe('ComponentVersionDetailsView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({
      applicationName: 'my-app',
      componentName: 'my-component',
      versionRevision: 'ver-1.0',
    });
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
    useApplicationBreadcrumbsMock.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render spinner while loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should render error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('Unable to load Component version')).toBeInTheDocument();
  });

  it('should render 404 when version is not found', () => {
    useParamsMock.mockReturnValue({
      applicationName: 'my-app',
      componentName: 'my-component',
      versionRevision: 'nonexistent',
    });
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('should render the version details page with tabs', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  it('should render breadcrumbs including component and version names', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('Versions')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
    expect(screen.getAllByText(/my-component/).length).toBeGreaterThanOrEqual(1);
  });

  it('should render the component name and version as the heading', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByRole('heading', { name: /my-component — Version 1.0/ })).toBeInTheDocument();
  });
});
