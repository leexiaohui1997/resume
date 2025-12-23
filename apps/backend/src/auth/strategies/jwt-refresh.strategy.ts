import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenType } from '../entity/token.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_REFRESH_SECRET', '') ||
        configService.get<string>('JWT_SECRET', ''),
    });
  }

  async validate(payload: JwtPayload) {
    // 确保令牌类型是刷新令牌
    if (payload.type !== TokenType.REFRESH) {
      throw new Error('无效的刷新令牌');
    }

    // 返回用户信息，将被添加到请求对象中
    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}
