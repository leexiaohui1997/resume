import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // 重写handleRequest方法，使认证失败时不抛出异常
  handleRequest<T = JwtPayload>(_err: unknown, user: T): T {
    // 如果有用户信息，返回用户信息
    // 否则返回null，不抛出异常
    return user;
  }
}
