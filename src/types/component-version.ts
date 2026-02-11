/**
 * Row type for the component versions list (Name, Description, Git branch or tag, Pipeline).
 * Used when displaying versions in the component details Versions tab.
 */
export type ComponentVersionRow = {
  name: string;
  description?: string;
  /** Branch or tag for the Git source link */
  gitRevision?: string;
  /** Pipeline run name for the Pipeline column link */
  pipelineRunName?: string;
};
