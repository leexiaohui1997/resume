import {
  login as apiLogin,
  logout as apiLogout,
  logoutAll as apiLogoutAll,
  register as apiRegister,
  getCurrentUser,
  type UserProfile,
} from '@/api/auth';
import router from '@/router';
import { ElMessage } from 'element-plus';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const refreshToken = ref(localStorage.getItem('refreshToken') || '');
  const profile = ref<UserProfile | null>(null);
  const isLogined = computed(() => !!token.value);

  // 登录
  const login = async (username: string, password: string) => {
    try {
      const res = await apiLogin({ username, password });

      // 保存令牌
      token.value = res.accessToken;
      refreshToken.value = res.refreshToken;
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);

      // 获取用户信息
      await fetchUserProfile();

      ElMessage.success('登录成功');
      return true;
    } catch (error) {
      console.error('登录失败:', error);
      return false;
    }
  };

  // 注册
  const register = async (username: string, password: string) => {
    try {
      await apiRegister({ username, password });
      ElMessage.success('注册成功，请登录');
      return true;
    } catch (error) {
      console.error('注册失败:', error);
      return false;
    }
  };

  // 获取用户信息
  const fetchUserProfile = async () => {
    try {
      const userProfile = await getCurrentUser();
      profile.value = userProfile;
      return userProfile;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  };

  // 登出
  const logout = async () => {
    try {
      await apiLogout(refreshToken.value);
    } catch (error) {
      console.error('登出请求失败:', error);
    } finally {
      // 无论请求是否成功，都清除本地状态
      clearAuthState();
    }
  };

  // 清除认证状态（不调用 API）
  const clearAuthState = () => {
    token.value = '';
    refreshToken.value = '';
    profile.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  // 登出所有设备
  const logoutAllDevices = async () => {
    try {
      await apiLogoutAll();
      ElMessage.success('已从所有设备登出');
    } catch (error) {
      console.error('登出所有设备失败:', error);
    } finally {
      // 无论请求是否成功，都清除本地状态
      clearAuthState();
    }
  };

  // 初始化用户状态
  const initUserState = async () => {
    if (token.value) {
      try {
        await fetchUserProfile();
      } catch {
        // 如果获取用户信息失败，清除无效令牌
        logout();
      }
    }
  };

  return {
    token,
    refreshToken,
    profile,
    isLogined,
    login,
    register,
    logout,
    logoutAllDevices,
    clearAuthState,
    fetchUserProfile,
    initUserState,
  };
});
