import type { RouteRecordRaw } from 'vue-router';
import { loadPages } from './load-pages';

const routes: RouteRecordRaw[] = [...loadPages()];

export default routes;
