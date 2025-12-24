import 'vue-router';
import type { LayoutType } from '../layouts';

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    layout?: LayoutType;
    requiresAuth?: boolean;
  }
}
