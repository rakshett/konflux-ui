import * as React from 'react';
import { Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import { PIPELINE_RUNS_DETAILS_PATH } from '~/routes/paths';
import { RowFunctionArgs, TableData } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { ComponentVersionRow } from '~/types/component-version';
import { componentVersionsTableColumnClasses } from './ComponentVersionsListHeader';

export type ComponentVersionsListRowCustomData = {
  gitUrl?: string;
  applicationName?: string;
};

type ComponentVersionsListRowProps = RowFunctionArgs<
  ComponentVersionRow,
  ComponentVersionsListRowCustomData
>;

const ComponentVersionsListRow: React.FC<
  React.PropsWithChildren<ComponentVersionsListRowProps>
> = ({ obj, customData }) => {
  const namespace = useNamespace();
  const gitUrl = customData?.gitUrl;
  const applicationName = customData?.applicationName;
  const { name, description, gitRevision, pipelineRunName } = obj;

  return (
    <>
      <TableData className={componentVersionsTableColumnClasses.name}>{name}</TableData>
      <TableData className={componentVersionsTableColumnClasses.description}>
        <Truncate content={description ?? '-'} />
      </TableData>
      <TableData className={componentVersionsTableColumnClasses.gitRevision}>
        {gitUrl && gitRevision ? (
          <GitRepoLink url={gitUrl} revision={gitRevision} />
        ) : (
          gitRevision ?? '-'
        )}
      </TableData>
      <TableData className={componentVersionsTableColumnClasses.pipeline}>
        {pipelineRunName && applicationName ? (
          <Link
            to={PIPELINE_RUNS_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              pipelineRunName,
            })}
          >
            {pipelineRunName}
          </Link>
        ) : (
          pipelineRunName ?? '-'
        )}
      </TableData>
      <TableData className={componentVersionsTableColumnClasses.kebab} />
    </>
  );
};

export default ComponentVersionsListRow;
