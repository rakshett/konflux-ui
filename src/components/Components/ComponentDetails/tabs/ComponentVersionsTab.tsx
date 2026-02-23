import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Spinner,
} from '@patternfly/react-core';
import { useComponent } from '~/hooks/useComponents';
import { COMPONENT_VERSION_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';

const ComponentVersionsTab: React.FC = () => {
  const namespace = useNamespace();
  const { componentName, applicationName } = useParams<RouterParams>();
  const [component, loaded, componentError] = useComponent(namespace, componentName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, loaded, 'component');
  }

  const versions = component.spec.source?.versions ?? [];

  if (versions.length === 0) {
    return (
      <div className="pf-v5-u-p-lg">
        <p>No versions defined for this component.</p>
      </div>
    );
  }

  return (
    <div className="pf-v5-u-p-lg">
      <DescriptionList data-test="component-versions-table">
        {versions.map((v) => (
          <DescriptionListGroup key={v.revision}>
            <DescriptionListTerm>{v.name}</DescriptionListTerm>
            <DescriptionListDescription>
              <Link
                to={COMPONENT_VERSION_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName: applicationName ?? '',
                  componentName: componentName ?? '',
                  versionRevision: v.revision,
                })}
                data-test={`version-link-${v.revision}`}
              >
                {v.revision}
              </Link>
            </DescriptionListDescription>
          </DescriptionListGroup>
        ))}
      </DescriptionList>
    </div>
  );
};

export default ComponentVersionsTab;
