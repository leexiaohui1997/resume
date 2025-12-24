import { defineRoute } from '@/utils/page';

export default defineRoute({
  path: '/',
  meta: {
    title: '首页',
    requiresAuth: false,
  },
});
