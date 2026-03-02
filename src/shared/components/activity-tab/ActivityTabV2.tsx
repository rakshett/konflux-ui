import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tab, Tabs, TabTitleText, Text } from '@patternfly/react-core';
import CommitsListViewV2 from '~/components/Commits/CommitsListPage/CommitsListViewV2';
import { DetailsSection } from '~/components/DetailsPage';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import PipelineRunsListViewV2 from '~/components/PipelineRun/PipelineRunListView/PipelineRunsListViewV2';
import { COMPONENT_ACTIVITY_V2_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';

const ACTIVITY_SECONDARY_TAB_KEY_V2 = 'activity-secondary-tab-v2';

const ActivityTabV2: React.FC = () => {
  const params = useParams<RouterParams>();
  const { componentName, activityTab } = params;
  const namespace = useNamespace();

  const storageKey = `${componentName ?? ''}_${ACTIVITY_SECONDARY_TAB_KEY_V2}`;
  const [lastSelectedTab, setLocalStorageItem] = useLocalStorage<string>(storageKey);

  const currentTab = activityTab || lastSelectedTab || 'latest-commits';

  const getActivityTabRoute = React.useCallback(
    (tab: string) =>
      `${COMPONENT_ACTIVITY_V2_PATH.createPath({
        workspaceName: namespace,
        componentName: componentName ?? '',
      })}/${tab}`,
    [namespace, componentName],
  );

  const navigate = useNavigate();
  const setActiveTab = React.useCallback(
    (newTab: string) => {
      if (currentTab !== newTab) {
        setLocalStorageItem(newTab);
        navigate(getActivityTabRoute(newTab));
      }
    },
    [currentTab, getActivityTabRoute, navigate, setLocalStorageItem],
  );

  React.useEffect(() => {
    if (activityTab && activityTab !== lastSelectedTab) {
      setLocalStorageItem(activityTab);
    }
  }, [activityTab, lastSelectedTab, setLocalStorageItem]);

  React.useEffect(() => {
    if (!activityTab && lastSelectedTab) {
      navigate(getActivityTabRoute(lastSelectedTab), { replace: true });
    }
  }, [activityTab, getActivityTabRoute, lastSelectedTab, navigate]);

  if (!componentName) {
    return <Text>Missing component name.</Text>;
  }

  return (
    <DetailsSection
      title="Activity"
      description="Monitor your commits and their pipeline progression across all component versions."
    >
      <Tabs
        style={{
          width: 'fit-content',
          marginBottom: 'var(--pf-v5-global--spacer--md)',
        }}
        activeKey={currentTab}
        onSelect={(_e, k: string) => {
          setActiveTab(k);
        }}
        data-test="activity-tab-v2-tabs"
        unmountOnExit
      >
        <Tab
          data-test="activity-tab-v2-commits"
          title={<TabTitleText>Latest commits</TabTitleText>}
          key="latest-commits"
          eventKey="latest-commits"
          className="activity-tab"
        >
          <FilterContextProvider filterParams={['name', 'status', 'version']}>
            <CommitsListViewV2 componentName={componentName} />
          </FilterContextProvider>
        </Tab>
        <Tab
          data-test="activity-tab-v2-pipelineruns"
          title={<TabTitleText>Pipeline runs</TabTitleText>}
          key="pipelineruns"
          eventKey="pipelineruns"
          className="activity-tab"
        >
          <FilterContextProvider filterParams={['name', 'status', 'type', 'version']}>
            <PipelineRunsListViewV2 componentName={componentName} />
          </FilterContextProvider>
        </Tab>
      </Tabs>
    </DetailsSection>
  );
};

export default ActivityTabV2;
