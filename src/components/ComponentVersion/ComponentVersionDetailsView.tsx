import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { useApplicationBreadcrumbs } from '~/components/Applications/breadcrumbs/breadcrumb-utils';
import { DetailsPage } from '~/components/DetailsPage';
import { useComponent } from '~/hooks/useComponents';
import {
  COMPONENT_DETAILS_PATH,
  COMPONENT_LIST_PATH,
  COMPONENT_VERSION_DETAILS_PATH,
  COMPONENT_VERSIONS_PATH,
} from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';
import { getComponentVersion } from '~/utils/version-utils';

const ComponentVersionDetailsView: React.FC = () => {
  const { componentName, applicationName, versionRevision } = useParams<RouterParams>();
  const namespace = useNamespace();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const [component, loaded, componentError] = useComponent(namespace, componentName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, loaded, 'Component version');
  }

  const version = getComponentVersion(component, versionRevision ?? '');
  if (!version) {
    return getErrorState({ code: 404 }, true, `Component version '${versionRevision}'`);
  }

  return (
    <DetailsPage
      data-test="version-details-test-id"
      headTitle={versionRevision ?? ''}
      title={
        <Text component={TextVariants.h2}>
          {component.metadata.name} — {version.name}
        </Text>
      }
      breadcrumbs={[
        ...applicationBreadcrumbs,
        {
          path: COMPONENT_LIST_PATH.createPath({
            workspaceName: namespace,
            applicationName: applicationName ?? '',
          }),
          name: 'components',
        },
        {
          path: COMPONENT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: applicationName ?? '',
            componentName: componentName ?? '',
          }),
          name: (component.spec.componentName || componentName) ?? '',
        },
        {
          path: COMPONENT_VERSIONS_PATH.createPath({
            workspaceName: namespace,
            applicationName: applicationName ?? '',
            componentName: componentName ?? '',
          }),
          name: 'Versions',
        },
        {
          path: COMPONENT_VERSION_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: applicationName ?? '',
            componentName: componentName ?? '',
            versionRevision: versionRevision ?? '',
          }),
          name: version.name,
        },
      ]}
      baseURL={COMPONENT_VERSION_DETAILS_PATH.createPath({
        workspaceName: namespace,
        applicationName: applicationName ?? '',
        componentName: componentName ?? '',
        versionRevision: versionRevision ?? '',
      })}
      tabs={[
        { key: 'index', label: 'Overview', isFilled: true },
        { key: 'activity', label: 'Activity' },
      ]}
    />
  );
};

export default ComponentVersionDetailsView;
