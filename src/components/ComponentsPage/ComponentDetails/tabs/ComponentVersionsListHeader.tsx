import { HeaderFunc } from '~/shared/components/table/Table';

export const componentVersionsTableColumnClasses = {
  name: 'pf-m-width-20 wrap-column',
  description: 'pf-m-width-25',
  gitRevision: 'pf-m-width-20',
  pipeline: 'pf-m-width-20',
  kebab: 'pf-v5-c-table__action',
};

const VERSIONS_COLUMNS = [
  { title: 'Name', className: componentVersionsTableColumnClasses.name },
  { title: 'Description', className: componentVersionsTableColumnClasses.description },
  { title: 'Git branch or tag', className: componentVersionsTableColumnClasses.gitRevision },
  { title: 'Pipeline', className: componentVersionsTableColumnClasses.pipeline },
  { title: ' ', className: componentVersionsTableColumnClasses.kebab },
];

export const getComponentVersionsListHeader: HeaderFunc = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- HeaderFunc signature requires componentProps; fixed columns do not use it
  _componentProps,
) =>
  VERSIONS_COLUMNS.map((col) => ({
    title: col.title,
    props: { className: col.className },
  }));
