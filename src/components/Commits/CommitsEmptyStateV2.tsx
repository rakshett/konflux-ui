import React from 'react';
import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '../../assets/Commit.svg';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';

const CommitsEmptyStateV2: React.FC = () => (
  <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Monitor your CI/CD activity in one place">
    <EmptyStateBody>
      Monitor any activity that happens once you push a commit. We&apos;ll build and test your
      source code, for both pull requests and merged code.
    </EmptyStateBody>
  </AppEmptyState>
);

export default CommitsEmptyStateV2;
