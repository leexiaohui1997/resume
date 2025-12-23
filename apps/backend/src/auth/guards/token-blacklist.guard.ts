import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExtractJwt } from 'passport-jwt';
import { TokenService } from '../token.service';

@Injectable()
export class TokenBlacklistGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 从请求中提取令牌
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (!token) {
      return true; // 如果没有令牌，让其他守卫处理
    }

    try {
      // 验证令牌是否在黑名单中
      await this.tokenService.verifyToken(token);
      return true;
    } catch {
      return false;
    }
  }
}
