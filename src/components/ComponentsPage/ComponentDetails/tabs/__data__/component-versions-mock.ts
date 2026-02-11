import { ComponentVersionRow } from '~/types/component-version';

/**
 * Mock component versions for tests and reference (aligned with Figma design).
 */
export const mockComponentVersions: ComponentVersionRow[] = [
  {
    name: 'Main',
    description: 'version 1.0',
    gitRevision: 'Main',
    pipelineRunName: 'docker-build-oci-ta',
  },
  {
    name: 'patch',
    description: 'patch for cva.xx.xx.xxx',
    gitRevision: 'patch',
    pipelineRunName: 'docker-build',
  },
  {
    name: 'test-pcam',
    description: 'testing automation',
    gitRevision: 'test-pcam',
    pipelineRunName: 'fbc-builder',
  },
  {
    name: 'test-oci',
    description: 'testing oci',
    gitRevision: 'test-oci',
    pipelineRunName: 'maven-zip-build-oci-ta',
  },
  {
    name: 'test-automerger',
    description: 'testing merger',
    gitRevision: 'test-automerger',
    pipelineRunName: 'docker-build-oci-ta',
  },
];

export const mockComponentVersion = mockComponentVersions[0];
