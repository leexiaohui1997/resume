import { useUserStore } from '@/stores/user';
import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// 全局前置守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore();

  // 判断路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);

  // 如果需要认证但用户未登录，重定向到登录页
  if (requiresAuth && !userStore.isLogined) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    });
  }
  // 如果已登录且访问登录或注册页，重定向到首页
  else if (userStore.isLogined && (to.path === '/login' || to.path === '/register')) {
    next('/');
  }
  // 其他情况正常放行
  else {
    next();
  }
});

router.afterEach(to => {
  document.title = to.meta.title || 'RESUME - 简历制作';
});

export default router;
