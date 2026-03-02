import * as React from 'react';
import { MultiSelect } from '../generic/MultiSelect';
import { PipelineRunsFilterStateV2 } from '../utils/pipelineruns-filter-utils-v2';
import { BaseTextFilterToolbar } from './BaseTextFIlterToolbar';

type PipelineRunsFilterToolbarV2Props = {
  filters: PipelineRunsFilterStateV2;
  setFilters: (f: PipelineRunsFilterStateV2) => void;
  onClearFilters: () => void;
  typeOptions: { [key: string]: number };
  statusOptions: { [key: string]: number };
  versionOptions?: { [key: string]: number };
  versionLabels?: Record<string, string>;
  openColumnManagement?: () => void;
  totalColumns?: number;
};

const PipelineRunsFilterToolbarV2: React.FC<PipelineRunsFilterToolbarV2Props> = ({
  filters,
  setFilters,
  onClearFilters,
  typeOptions,
  statusOptions,
  versionOptions,
  versionLabels,
  openColumnManagement,
  totalColumns,
}) => {
  const { name, status, type, version } = filters;

  return (
    <BaseTextFilterToolbar
      text={name}
      label="name"
      setText={(newName) => setFilters({ ...filters, name: newName })}
      onClearFilters={onClearFilters}
      openColumnManagement={openColumnManagement}
      totalColumns={totalColumns}
    >
      <MultiSelect
        label="Status"
        filterKey="status"
        values={status}
        setValues={(newFilters) => setFilters({ ...filters, status: newFilters })}
        options={statusOptions}
      />
      <MultiSelect
        label="Type"
        filterKey="type"
        values={type}
        setValues={(newFilters) => setFilters({ ...filters, type: newFilters })}
        options={typeOptions}
      />
      {versionOptions && (
        <MultiSelect
          label="Version"
          filterKey="version"
          values={version}
          setValues={(newFilters) => setFilters({ ...filters, version: newFilters })}
          options={versionOptions}
          optionLabels={versionLabels}
        />
      )}
    </BaseTextFilterToolbar>
  );
};

export default PipelineRunsFilterToolbarV2;
