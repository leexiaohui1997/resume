import { ConfigService } from '@nestjs/config';

/**
 * 获取 CORS 配置
 * @param configService 配置服务
 * @returns CORS 配置选项
 */
export const getCorsConfig = (configService: ConfigService) => {
  const isDevelopment = configService.get<string>('NODE_ENV') !== 'production';
  const allowedOrigins = isDevelopment
    ? ['http://localhost:5173', 'http://localhost:3000']
    : [configService.get<string>('FRONTEND_URL', '')].filter(Boolean);

  return {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
    ],
    exposedHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 86400, // 24小时
  };
};
