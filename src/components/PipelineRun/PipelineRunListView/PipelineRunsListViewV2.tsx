import * as React from 'react';
import { Bullseye, Flex, Spinner, Stack } from '@patternfly/react-core';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import { getErrorState } from '~/shared/utils/error-utils';
import { SESSION_STORAGE_KEYS } from '../../../consts/constants';
import {
  PIPELINE_RUN_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS,
  NON_HIDABLE_PIPELINE_RUN_COLUMNS,
  PipelineRunColumnKeys,
} from '../../../consts/pipeline';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useComponent } from '../../../hooks/useComponents';
import { usePipelineRunsV2 } from '../../../hooks/usePipelineRunsV2';
import { usePLRVulnerabilities } from '../../../hooks/useScanResults';
import { useVisibleColumns } from '../../../hooks/useVisibleColumns';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { useNamespace } from '../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../types';
import { statuses } from '../../../utils/commits-utils';
import { pipelineRunStatus } from '../../../utils/pipeline-utils';
import { pipelineRunTypes } from '../../../utils/pipelinerun-utils';
import PipelineRunsFilterToolbarV2 from '../../Filter/toolbars/PipelineRunsFilterToolbarV2';
import {
  filterPipelineRunsV2,
  PipelineRunsFilterStateV2,
} from '../../Filter/utils/pipelineruns-filter-utils-v2';
import PipelineRunEmptyStateV2 from '../PipelineRunEmptyStateV2';
import { getPipelineRunListHeader } from './PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from './PipelineRunListRow';

export interface PipelineRunsListViewV2Props {
  componentName: string;
  /** When on version details page, scope pipeline runs to this version (revision). */
  versionRevision?: string;
  /** Alias for versionRevision for API compatibility. */
  versionName?: string;
  customFilter?: (plr: PipelineRunKind) => boolean;
}

const PipelineRunsListViewV2: React.FC<React.PropsWithChildren<PipelineRunsListViewV2Props>> = ({
  componentName,
  versionRevision,
  versionName,
  customFilter,
}) => {
  const namespace = useNamespace();
  const version = versionRevision ?? versionName;
  const [component, componentLoaded, componentError] = useComponent(namespace, componentName, true);
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  const filters: PipelineRunsFilterStateV2 = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
    version: unparsedFilters.version ? (unparsedFilters.version as string[]) : [],
  });

  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = useVisibleColumns(
    SESSION_STORAGE_KEYS.PIPELINES_VISIBLE_COLUMNS,
    DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS,
  );

  const { name, status, type, version: versionFilter } = filters;

  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsV2(
      componentLoaded && !componentError ? namespace : null,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: component?.metadata?.creationTimestamp,
            filterByName: name || undefined,
            matchLabels: {
              [PipelineRunLabel.COMPONENT]: componentName,
              ...(version && { [PipelineRunLabel.COMPONENT_VERSION]: version }),
            },
          },
        }),
        [component?.metadata?.creationTimestamp, componentName, version, name],
      ),
    );

  const sortedPipelineRuns = React.useMemo((): PipelineRunKind[] => {
    if (!pipelineRuns) return [];

    // @ts-expect-error: toSorted might not be in TS yet
    if (typeof pipelineRuns.toSorted === 'function') {
      // @ts-expect-error: toSorted might not be in TS yet
      return pipelineRuns.toSorted((a, b) =>
        String(b.status?.startTime || '').localeCompare(String(a.status?.startTime || '')),
      );
    }

    return pipelineRuns.sort((a, b) =>
      String(b.status?.startTime || '').localeCompare(String(a.status?.startTime || '')),
    ) as PipelineRunKind[];
  }, [pipelineRuns]);

  const statusFilterObj = React.useMemo(
    () =>
      createFilterObj(sortedPipelineRuns, (plr) => pipelineRunStatus(plr), statuses, customFilter),
    [sortedPipelineRuns, customFilter],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        sortedPipelineRuns,
        (plr) => plr?.metadata.labels?.[PipelineRunLabel.PIPELINE_TYPE],
        pipelineRunTypes,
        customFilter,
      ),
    [sortedPipelineRuns, customFilter],
  );

  const allVersions = React.useMemo(
    () => component?.spec?.source?.versions ?? [],
    [component?.spec?.source?.versions],
  );
  const allVersionBranches = React.useMemo(() => allVersions.map((v) => v.revision), [allVersions]);
  const versionLabelMap = React.useMemo(
    () => Object.fromEntries(allVersions.map((v) => [v.revision, v.name])),
    [allVersions],
  );
  const versionFilterObj = React.useMemo(
    () => Object.fromEntries(allVersionBranches.map((b) => [b, 0])),
    [allVersionBranches],
  );

  const filteredPLRs = React.useMemo(
    () => filterPipelineRunsV2(sortedPipelineRuns, filters, componentName),
    [sortedPipelineRuns, filters, componentName],
  );

  const vulnerabilities = usePLRVulnerabilities(name ? filteredPLRs : sortedPipelineRuns);

  const EmptyMsg = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;
  const NoDataEmptyMsg = () => <PipelineRunEmptyStateV2 />;

  const err = componentError ?? error;
  if (err) {
    return getErrorState(err, loaded, 'pipeline runs');
  }

  const isFiltered =
    name.length > 0 ||
    type.length > 0 ||
    status.length > 0 ||
    (!version && versionFilter.length > 0);

  return (
    <Flex direction={{ default: 'column' }}>
      {(isFiltered || sortedPipelineRuns.length > 0) && (
        <PipelineRunsFilterToolbarV2
          filters={filters}
          setFilters={setFilters}
          onClearFilters={onClearFilters}
          typeOptions={typeFilterObj}
          statusOptions={statusFilterObj}
          versionOptions={!version ? versionFilterObj : undefined}
          versionLabels={!version ? versionLabelMap : undefined}
          openColumnManagement={() => setIsColumnManagementOpen(true)}
          totalColumns={PIPELINE_RUN_COLUMNS_DEFINITIONS.length}
        />
      )}
      <Table
        data={filteredPLRs}
        unfilteredData={sortedPipelineRuns}
        EmptyMsg={isFiltered ? EmptyMsg : NoDataEmptyMsg}
        aria-label="Pipeline run List"
        customData={vulnerabilities}
        Header={getPipelineRunListHeader(visibleColumns)}
        Row={(props) => (
          <PipelineRunListRowWithColumns
            obj={props.obj as PipelineRunKind}
            columns={props.columns || []}
            customData={vulnerabilities}
            index={props.index}
            visibleColumns={visibleColumns}
          />
        )}
        loaded={isFetchingNextPage || loaded}
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
        isInfiniteLoading
        infiniteLoaderProps={{
          isRowLoaded: (args) => {
            return !!filteredPLRs[args.index];
          },
          loadMoreRows: () => {
            hasNextPage && !isFetchingNextPage && getNextPage?.();
          },
          rowCount: hasNextPage ? filteredPLRs.length + 1 : filteredPLRs.length,
        }}
      />
      {isFetchingNextPage ? (
        <Stack style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }} hasGutter>
          <Bullseye>
            <Spinner size="lg" aria-label="Loading more pipeline runs" />
          </Bullseye>
        </Stack>
      ) : null}
      <ColumnManagement<PipelineRunColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={(cols) => setVisibleColumns(cols)}
        columns={PIPELINE_RUN_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_PIPELINE_RUN_COLUMNS}
        nonHidableColumns={NON_HIDABLE_PIPELINE_RUN_COLUMNS}
        title="Manage pipeline run columns"
        description="Selected columns will be displayed in the pipeline runs table."
      />
    </Flex>
  );
};

export default PipelineRunsListViewV2;
