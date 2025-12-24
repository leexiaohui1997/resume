import router from '@/router';
import { useUserStore } from '@/stores/user';
import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
service.interceptors.request.use(
  config => {
    const userStore = useUserStore();
    // 如果有 token，添加到请求头
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  ({ data }: AxiosResponse) => {
    if (data.code !== 0) {
      throw new Error(data.message);
    }
    return data.data;
  },
  error => {
    const { response } = error;

    // 处理 401 未授权错误
    if (response && response.status === 401) {
      // 401 错误表示令牌无效，清除本地状态
      const userStore = useUserStore();
      userStore.clearAuthState();
      router.push('/login');
      ElMessage.error('登录已过期，请重新登录');
    } else if (response && response.data && response.data.message) {
      // 显示后端返回的错误信息
      ElMessage.error(response.data.message);
    } else {
      // 显示通用错误信息
      ElMessage.error('请求失败，请稍后重试');
    }

    return Promise.reject(error);
  }
);

export default service;
