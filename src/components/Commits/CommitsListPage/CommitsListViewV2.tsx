import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { FilterContext } from '~/components/Filter/generic/FilterContext';
import { MultiSelect } from '~/components/Filter/generic/MultiSelect';
import { BaseTextFilterToolbar } from '~/components/Filter/toolbars/BaseTextFIlterToolbar';
import { createFilterObj } from '~/components/Filter/utils/filter-utils';
import ColumnManagement from '~/shared/components/table/ColumnManagement';
import { getErrorState } from '~/shared/utils/error-utils';
import { SESSION_STORAGE_KEYS } from '../../../consts/constants';
import {
  PipelineRunLabel,
  PipelineRunType,
  RUN_STATUS_PRIORITY,
  runStatus,
} from '../../../consts/pipelinerun';
import { useComponent } from '../../../hooks/useComponents';
import { usePipelineRunsV2 } from '../../../hooks/usePipelineRunsV2';
import { useSortedResources } from '../../../hooks/useSortedResources';
import { useVisibleColumns } from '../../../hooks/useVisibleColumns';
import { Table, useDeepCompareMemoize } from '../../../shared';
import FilteredEmptyState from '../../../shared/components/empty-state/FilteredEmptyState';
import { useNamespace } from '../../../shared/providers/Namespace';
import { Commit, PipelineRunKind } from '../../../types';
import { getCommitsFromPLRs, getCommitSha, statuses } from '../../../utils/commits-utils';
import { getCommitStatusFromPipelineRuns } from '../commit-status';
import CommitsEmptyStateV2 from '../CommitsEmptyStateV2';
import {
  CommitColumnKeys,
  COMMIT_COLUMNS_DEFINITIONS,
  DEFAULT_VISIBLE_COMMIT_COLUMNS,
  NON_HIDABLE_COMMIT_COLUMNS,
  SortableHeaders,
} from './commits-columns-config';
import { getCommitsListHeaderWithColumns } from './CommitsListHeader';
import CommitsListRow from './CommitsListRow';

const getSortCommitFunction = (
  key: string,
  activeSortDirection: SortByDirection,
  commitStatusMap: Record<string, runStatus>,
) => {
  switch (key) {
    case 'status':
      return (a: Commit, b: Commit) => {
        const aStatus = commitStatusMap[a.sha];
        const bStatus = commitStatusMap[b.sha];
        const aValue = RUN_STATUS_PRIORITY[aStatus] || 999;
        const bValue = RUN_STATUS_PRIORITY[bStatus] || 999;
        if (aValue < bValue) {
          return activeSortDirection === SortByDirection.asc ? -1 : 1;
        }
        if (aValue > bValue) {
          return activeSortDirection === SortByDirection.asc ? 1 : -1;
        }
        return 0;
      };
    default:
      return null;
  }
};

export interface CommitsListViewV2Props {
  componentName: string;
  versionRevision?: string;
  /** Alias for versionRevision for API compatibility. */
  versionName?: string;
}

const CommitsListViewV2: React.FC<React.PropsWithChildren<CommitsListViewV2Props>> = ({
  componentName,
  versionRevision,
  versionName,
}) => {
  const version = versionRevision ?? versionName;
  const namespace = useNamespace();
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);

  const [visibleColumns, setVisibleColumns] = useVisibleColumns(
    SESSION_STORAGE_KEYS.COMMITS_VISIBLE_COLUMNS,
    DEFAULT_VISIBLE_COMMIT_COLUMNS,
  );
  const [isColumnManagementOpen, setIsColumnManagementOpen] = React.useState(false);

  const sortPaths: Record<SortableHeaders, string> = {
    [SortableHeaders.name]: 'shaTitle',
    [SortableHeaders.branch]: 'branch',
    [SortableHeaders.byUser]: 'user',
    [SortableHeaders.committedAt]: 'creationTime',
    [SortableHeaders.status]: '',
  };

  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(SortableHeaders.committedAt);
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.desc,
  );
  const filters = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
  });

  const { name: nameFilter, status: statusFilter } = filters;

  const [component, componentLoaded] = useComponent(namespace, componentName);
  const [pipelineRuns, loaded, error, getNextPage, { isFetchingNextPage, hasNextPage }] =
    usePipelineRunsV2(
      componentLoaded ? namespace : null,
      React.useMemo(
        () => ({
          selector: {
            filterByCreationTimestampAfter: component?.metadata?.creationTimestamp,
            matchLabels: {
              [PipelineRunLabel.COMPONENT]: componentName,
              ...(version && {
                [PipelineRunLabel.COMPONENT_VERSION]: version,
              }),
            },
          },
        }),
        [component?.metadata?.creationTimestamp, componentName, version],
      ),
    );

  const buildPipelineRuns = React.useMemo(
    () =>
      pipelineRuns?.filter(
        (plr) => plr.metadata?.labels?.[PipelineRunLabel.PIPELINE_TYPE] === PipelineRunType.BUILD,
      ) || [],
    [pipelineRuns],
  );

  const componentNames = React.useMemo(() => [componentName], [componentName]);

  const allPipelineRunsFilteredByComponents = React.useMemo(
    () =>
      pipelineRuns?.filter((plr) =>
        componentNames.includes(plr.metadata?.labels?.[PipelineRunLabel.COMPONENT]),
      ),
    [componentNames, pipelineRuns],
  );

  const commits = React.useMemo(
    () => (loaded && buildPipelineRuns && getCommitsFromPLRs(buildPipelineRuns)) || [],
    [loaded, buildPipelineRuns],
  );

  const commitPipelineRunMap = React.useMemo<Record<string, PipelineRunKind[]>>(
    () =>
      allPipelineRunsFilteredByComponents.reduce(
        (acc, plr) => {
          const sha = getCommitSha(plr);
          if (sha) {
            if (!acc[sha]) acc[sha] = [];
            acc[sha].push(plr);
          }
          return acc;
        },
        {} as Record<string, PipelineRunKind[]>,
      ),
    [allPipelineRunsFilteredByComponents],
  );

  const commitStatusMap = React.useMemo<Record<string, runStatus>>(
    () =>
      Object.entries(commitPipelineRunMap).reduce(
        (acc, [sha, commitPipelineRuns]) => {
          acc[sha] = getCommitStatusFromPipelineRuns(commitPipelineRuns);
          return acc;
        },
        {} as Record<string, runStatus>,
      ),
    [commitPipelineRunMap],
  );

  const statusFilterObj = React.useMemo(
    () => createFilterObj(commits, (c) => commitStatusMap[c.sha] || runStatus.Unknown, statuses),
    [commits, commitStatusMap],
  );

  const filteredCommits = React.useMemo(
    () =>
      commits.filter((commit) => {
        const commitStatus = commitStatusMap[commit.sha] || runStatus.Unknown;
        return (
          (!nameFilter ||
            commit.sha.indexOf(nameFilter) !== -1 ||
            commit.components.some(
              (c) => c.toLowerCase().indexOf(nameFilter.trim().toLowerCase()) !== -1,
            ) ||
            commit.pullRequestNumber
              .toLowerCase()
              .indexOf(nameFilter.trim().replace('#', '').toLowerCase()) !== -1 ||
            commit.shaTitle.toLowerCase().includes(nameFilter.trim().toLowerCase())) &&
          (!statusFilter.length || statusFilter.includes(commitStatus))
        );
      }),
    [commits, nameFilter, statusFilter, commitStatusMap],
  );

  const defaultSortedCommits = useSortedResources(
    filteredCommits,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  const sortedCommits = React.useMemo(() => {
    if (activeSortIndex === SortableHeaders.status) {
      const customSortFn = getSortCommitFunction('status', activeSortDirection, commitStatusMap);
      return [...filteredCommits].sort(customSortFn);
    }
    return defaultSortedCommits;
  }, [
    filteredCommits,
    activeSortIndex,
    activeSortDirection,
    defaultSortedCommits,
    commitStatusMap,
  ]);

  const NoDataEmptyMessage = () => <CommitsEmptyStateV2 />;
  const EmptyMessage = () => <FilteredEmptyState onClearFilters={() => onClearFilters()} />;

  const DataToolbar = (
    <BaseTextFilterToolbar
      text={nameFilter}
      label="name"
      setText={(name) => setFilters({ ...filters, name })}
      onClearFilters={onClearFilters}
      data-test="commit-list-toolbar"
      totalColumns={COMMIT_COLUMNS_DEFINITIONS.length}
      openColumnManagement={() => setIsColumnManagementOpen(true)}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={statusFilter}
        setValues={(newFilters) => setFilters({ ...filters, status: newFilters })}
        options={statusFilterObj}
      />
    </BaseTextFilterToolbar>
  );

  React.useEffect(() => {
    if (
      loaded &&
      buildPipelineRuns?.length === 0 &&
      hasNextPage &&
      !isFetchingNextPage &&
      getNextPage
    ) {
      getNextPage();
    }
  }, [getNextPage, hasNextPage, isFetchingNextPage, loaded, buildPipelineRuns]);

  const CommitsListHeaderWithSorting = React.useMemo(
    () =>
      getCommitsListHeaderWithColumns(
        visibleColumns,
        activeSortIndex,
        activeSortDirection,
        (_, index, direction) => {
          setActiveSortIndex(index);
          setActiveSortDirection(direction);
        },
      ),
    [visibleColumns, activeSortIndex, activeSortDirection],
  );

  if (error) {
    return getErrorState(error, loaded, 'commits');
  }

  return (
    <>
      <Table
        virtualize
        data={sortedCommits}
        unfilteredData={commits}
        EmptyMsg={EmptyMessage}
        NoDataEmptyMsg={NoDataEmptyMessage}
        Toolbar={DataToolbar}
        aria-label="Commit List"
        Header={CommitsListHeaderWithSorting}
        Row={(props) => {
          const commit = props.obj as Commit;
          return (
            <CommitsListRow
              obj={commit}
              visibleColumns={visibleColumns}
              status={commitStatusMap[commit.sha] || runStatus.Unknown}
            />
          );
        }}
        loaded={loaded && !(hasNextPage && buildPipelineRuns?.length === 0)}
        getRowProps={(obj: Commit) => ({ id: obj.sha })}
        onRowsRendered={({ stopIndex }) => {
          if (
            loaded &&
            stopIndex === sortedCommits.length - 1 &&
            hasNextPage &&
            !isFetchingNextPage
          ) {
            getNextPage?.();
          }
        }}
      />
      <ColumnManagement<CommitColumnKeys>
        isOpen={isColumnManagementOpen}
        onClose={() => setIsColumnManagementOpen(false)}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={setVisibleColumns}
        columns={COMMIT_COLUMNS_DEFINITIONS}
        defaultVisibleColumns={DEFAULT_VISIBLE_COMMIT_COLUMNS}
        nonHidableColumns={NON_HIDABLE_COMMIT_COLUMNS}
        title="Manage commit columns"
        description="Selected columns will be displayed in the commits table."
      />
      {isFetchingNextPage ? (
        <div
          style={{
            marginTop: 'var(--pf-v5-global--spacer--2xl)',
            marginBottom: 'var(--pf-v5-global--spacer--2xl)',
          }}
        >
          <Bullseye>
            <Spinner
              size="lg"
              aria-label="Loading more commits"
              data-test="commits-list-next-page-loading-spinner"
            />
          </Bullseye>
        </div>
      ) : null}
    </>
  );
};

export default CommitsListViewV2;
