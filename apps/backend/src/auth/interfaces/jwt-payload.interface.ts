import { TokenType } from '../entity/token.entity';

export interface JwtPayload {
  sub: number; // 用户ID
  username: string; // 用户名
  type: TokenType; // 令牌类型
  iat: number; // 签发时间
  exp: number; // 过期时间
  jti?: string; // JWT ID (可选)
}
