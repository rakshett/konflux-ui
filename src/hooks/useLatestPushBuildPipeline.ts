import * as React from 'react';
import {
  PipelineRunEventType,
  PipelineRunLabel,
  PipelineRunType,
  runStatus,
} from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { pipelineRunStatus } from '~/utils/pipeline-utils';
import { usePipelineRunsV2 } from './usePipelineRunsV2';

export const useLatestBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
): [PipelineRunKind, boolean, unknown] => {
  const result = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
          },
        },
        limit: 1,
      }),
      [componentName],
    ),
  ) as unknown as [PipelineRunKind[], boolean, unknown];

  return React.useMemo(() => [result[0]?.[0], result[1], result[2]], [result]);
};

/**
 * Returns the latest successful build pipeline run for a component (optionally for a specific version/branch).
 * @param version - Optional version revision (e.g. branch name). When PipelineRunLabel.COMPONENT_VERSION
 * is added to pipeline runs, replace the no-op below with: ...(version && { [PipelineRunLabel.COMPONENT_VERSION]: version })
 */
export const useLatestSuccessfulBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
  version?: string,
): [PipelineRunKind, boolean, unknown] => {
  const [pipelines, loaded, error, getNextPage] = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
            // No-op until COMPONENT_VERSION label exists: satisfies TS noUnusedParameters + keeps version in deps
            ...(version !== undefined ? {} : {}),
          },
        },
      }),
      [componentName, version],
    ),
  );

  const latestSuccess = React.useMemo(
    () =>
      loaded &&
      !error &&
      pipelines?.find((pipeline) => pipelineRunStatus(pipeline) === runStatus.Succeeded),
    [error, loaded, pipelines],
  );

  React.useEffect(() => {
    if (loaded && !error && !latestSuccess && getNextPage) {
      getNextPage();
    }
  }, [loaded, error, getNextPage, latestSuccess]);

  return [latestSuccess, loaded, error];
};

export const useLatestPushBuildPipelineRunForComponentV2 = (
  namespace: string,
  componentName: string,
): [PipelineRunKind, boolean, unknown] => {
  const result = usePipelineRunsV2(
    namespace,
    React.useMemo(
      () => ({
        selector: {
          matchLabels: {
            [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.BUILD,
            [PipelineRunLabel.COMPONENT]: componentName,
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: PipelineRunEventType.PUSH,
          },
        },
        limit: 1,
      }),
      [componentName],
    ),
  );

  return [result[0]?.[0], result[1], result[2]];
};
