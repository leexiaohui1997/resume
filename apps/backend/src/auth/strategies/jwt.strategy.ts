import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenType } from '../entity/token.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TokenService } from '../token.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', ''),
    });
  }

  async validate(payload: JwtPayload) {
    // 确保令牌类型是访问令牌
    if (payload.type !== TokenType.ACCESS) {
      throw new Error('无效的令牌类型');
    }

    // 返回用户信息，将被添加到请求对象中
    return {
      userId: payload.sub,
      username: payload.username,
    };
  }
}
