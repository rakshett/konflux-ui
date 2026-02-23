import { ComponentKind, ComponentVersion } from '~/types';

/**
 * Returns the component version that matches the given revision (branch/tag name).
 */
export const getComponentVersion = (
  component: ComponentKind,
  versionRevision: string,
): ComponentVersion | undefined =>
  component.spec.source?.versions?.find((v) => v.revision === versionRevision);
