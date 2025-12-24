import service from './index';

// 用户登录
export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
}

export const login = (params: LoginParams): Promise<LoginResponse> => {
  return service.post('/auth/login', params);
};

// 用户注册
export interface RegisterParams {
  username: string;
  password: string;
}

export const register = (params: RegisterParams): Promise<void> => {
  return service.post('/user/register', params);
};

// 刷新令牌
export interface RefreshTokenParams {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export const refreshToken = (params: RefreshTokenParams): Promise<RefreshTokenResponse> => {
  return service.post('/auth/refresh', params);
};

// 获取用户信息
export interface UserProfile {
  id: number;
  username: string;
  avatarUrl?: string;
  nickname?: string;
}

export const getCurrentUser = (): Promise<UserProfile> => {
  return service.get('/auth/profile');
};

// 用户登出
export const logout = (refreshToken?: string): Promise<{ success: boolean }> => {
  return service.post('/auth/logout', { refreshToken });
};

// 用户登出所有设备
export const logoutAll = (): Promise<{ success: boolean }> => {
  return service.post('/auth/logout-all');
};
