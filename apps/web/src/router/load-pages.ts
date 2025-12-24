import type { RouteRecordRaw } from 'vue-router';

export function loadPages(): RouteRecordRaw[] {
  const pageEntries = import.meta.glob('@/pages/**/index.vue');
  const pageRoutes = import.meta.glob<{ default: RouteRecordRaw }>('@/pages/**/route.ts', {
    eager: true,
  });

  return Object.entries(pageEntries).map(([pageFile, pageImport]): RouteRecordRaw => {
    const routeFile = pageFile.replace(/index\.vue$/, 'route.ts');
    const { meta: routeMeta, ...route } = pageRoutes[routeFile]?.default || {};

    const paths = pageFile.split('/').slice(3, -1);
    const name = paths.join('-');
    const path = `/${paths.join('/')}`;

    return Object.assign(
      {
        name,
        path,
        component: pageImport,
        meta: {
          ...routeMeta,
        },
      },
      route
    );
  });
}
