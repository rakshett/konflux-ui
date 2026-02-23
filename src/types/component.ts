import { ResourceStatusCondition } from './common-types';
import { K8sResourceCommon } from './k8s';

export type ResourceRequirements = {
  requests?: {
    memory: string;
    cpu: string;
  };
  limits?: {
    memory: string;
    cpu: string;
  };
};

export type ComponentSource = {
  url?: string;
  git?: {
    url: string;
    devfileUrl?: string;
    dockerfileUrl?: string;
    revision?: string;
    context?: string;
  };
  versions?: ComponentVersion[];
};

export type ComponentVersion = {
  name: string;
  revision: string;
  context?: string;
  'skip-builds'?: boolean;
  'build-pipeline'?: ComponentBuildPipeline;
  dockerfileUri?: string;
};

export type PipelineSpecFromBundle = {
  bundle: string;
  name: string;
};

export type PipelineRefGit = {
  pathInRepo: string;
  revision: string;
  url: string;
};

export type PipelineDefinition = {
  'pipelineref-by-git-resolver'?: PipelineRefGit;
  'pipelineref-by-name'?: string;
  'pipelinespec-from-bundle'?: PipelineSpecFromBundle;
};

export type ComponentBuildPipeline = {
  'pull-and-push'?: PipelineDefinition;
  pull?: PipelineDefinition;
  push?: PipelineDefinition;
};

export enum NudgeStats {
  NUDGES = 'build-nudges-ref',
  NUDGED_BY = 'build-nudged-by',
}

export type ComponentSpecs = {
  componentName: string;
  gitProviderAnnotation?: string;
  gitURLAnnotation?: string;
  application: string;
  secret?: string;
  source?: ComponentSource;
  containerImage?: string;
  resources?: ResourceRequirements;
  replicas?: number;
  releaseStrategies?: string[];
  targetPort?: number;
  route?: string;
  [NudgeStats.NUDGES]?: string[];
  env?: {
    name: string;
    value: string;
  }[];
  'default-build-pipeline'?: ComponentBuildPipeline;
};

export type ComponentKind = K8sResourceCommon & {
  spec: ComponentSpecs;
  status?: {
    lastPromotedImage?: string;
    containerImage?: string;
    conditions?: ResourceStatusCondition[];
    devfile?: string;
    gitops?: { repositoryURL?: string; branch?: string; context?: string; commitID?: string };
    webhook?: string;
    [NudgeStats.NUDGED_BY]?: string[];
  };
};
