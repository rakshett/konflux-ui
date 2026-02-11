import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Spinner,
} from '@patternfly/react-core';
import { FilterContext, FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { useComponent } from '~/hooks/useComponents';
import { useComponentVersions } from '~/hooks/useComponentVersions';
import { Table } from '~/shared';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentVersionRow } from '~/types/component-version';
import { RouterParams } from '../../../../routes/utils';
import { DetailsSection } from '../../../DetailsPage';
import { getComponentVersionsListHeader } from './ComponentVersionsListHeader';
import ComponentVersionsListRow from './ComponentVersionsListRow';

const VersionsEmptyState: React.FC = () => (
  <EmptyState variant={EmptyStateVariant.full} data-test="versions-empty-state">
    <EmptyStateBody>No versions found for this component.</EmptyStateBody>
  </EmptyState>
);

const ComponentVersionsTabContent: React.FC = () => {
  const params = useParams<RouterParams>();
  const componentName = params.componentName ?? '';
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const [component, componentLoaded, componentError] = useComponent(namespace, componentName);
  const [versions, versionsLoaded, versionsError] = useComponentVersions(namespace, componentName);

  const nameFilter: string = typeof unparsedFilters.name === 'string' ? unparsedFilters.name : '';

  const filteredVersions = React.useMemo(() => {
    if (!Array.isArray(versions)) return [];
    if (!nameFilter) return versions;
    const lower = nameFilter.toLowerCase();
    return versions.filter((v: ComponentVersionRow) =>
      (v.name ?? '').toLowerCase().includes(lower),
    );
  }, [versions, nameFilter]);

  if (!componentLoaded || !component) {
    return (
      <Bullseye>
        <Spinner data-test="versions-tab-spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, componentLoaded, 'component');
  }

  if (versionsError) {
    return getErrorState(versionsError, versionsLoaded, 'versions');
  }

  const gitUrl = component.spec?.source?.url ?? component.spec?.source?.git?.url;
  const applicationName = component.spec?.application;
  const customData = { gitUrl, applicationName };

  const DataToolbar = (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="name"
      setText={(name) => setFilters({ name })}
      onClearFilters={onClearFilters}
      dataTest="component-versions-list-toolbar"
      showSearchInput
    />
  );

  return (
    <>
      <Table
        data-test="component-versions-table"
        data={filteredVersions}
        unfilteredData={versions}
        aria-label="Component versions list"
        Header={getComponentVersionsListHeader}
        Row={ComponentVersionsListRow}
        customData={customData}
        loaded={versionsLoaded}
        Toolbar={DataToolbar}
        NoDataEmptyMsg={VersionsEmptyState}
        EmptyMsg={() => <FilteredEmptyState onClearFilters={onClearFilters} />}
        getRowProps={(obj: ComponentVersionRow) => ({
          id: `version-${obj.name}`,
        })}
        virtualize={false}
      />
    </>
  );
};

const ComponentVersionsTab: React.FC = () => {
  return (
    <div>
      <DetailsSection title="Versions" description="View and manage versions of this component.">
        <FilterContextProvider filterParams={['name']}>
          <ComponentVersionsTabContent />
        </FilterContextProvider>
      </DetailsSection>
    </div>
  );
};

export default ComponentVersionsTab;
