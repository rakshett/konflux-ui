import * as React from 'react';
import { ComponentVersionRow } from '~/types/component-version';

/**
 * Returns the list of versions for a component.
 * TODO: Wire to ComponentVersion CRD/API when available (KFLUXUI-1007).
 * Until then returns empty list so the Versions tab and table render correctly.
 */
export const useComponentVersions = (
  namespace: string | null,
  componentName: string | null,
): [ComponentVersionRow[], boolean, unknown] => {
  return React.useMemo(() => {
    if (!namespace || !componentName) {
      return [[], true, null];
    }
    // Placeholder: no ComponentVersion API yet; return empty list, loaded, no error
    return [[], true, null];
  }, [namespace, componentName]);
};
