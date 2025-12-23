import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { StringValue } from 'ms';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { Token, TokenType } from './entity/token.entity';

export interface TokenPayload {
  sub: number;
  username: string;
  type: TokenType;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  /**
   * 生成访问令牌
   * @param user 用户信息
   * @returns 访问令牌
   */
  async generateAccessToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      type: TokenType.ACCESS,
    };

    const expiresIn = this.configService.get<StringValue>('JWT_EXPIRES_IN', '15m');
    const token = this.jwtService.sign(payload, { expiresIn });

    // 保存令牌到数据库
    await this.saveToken(token, TokenType.ACCESS, user);

    return token;
  }

  /**
   * 生成刷新令牌
   * @param user 用户信息
   * @returns 刷新令牌
   */
  async generateRefreshToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      type: TokenType.REFRESH,
    };

    const expiresIn = this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN', '7d');
    const token = this.jwtService.sign(payload, { expiresIn });

    // 保存令牌到数据库
    await this.saveToken(token, TokenType.REFRESH, user);

    return token;
  }

  /**
   * 验证令牌
   * @param token 令牌
   * @returns 验证结果，包含令牌载荷信息
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      // 检查令牌是否在黑名单中（已撤销）
      const tokenEntity = await this.tokenRepository.findOne({
        where: { token, isRevoked: true },
      });

      if (tokenEntity) {
        throw new Error('Token已撤销');
      }

      // 验证JWT令牌
      return this.jwtService.verify(token);
    } catch (error) {
      this.logger.error(`令牌验证失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   * @returns 新的访问令牌
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      // 验证刷新令牌
      const payload = await this.verifyToken(refreshToken);

      if (payload.type !== TokenType.REFRESH) {
        throw new Error('无效的刷新令牌');
      }

      // 获取用户信息
      const user = await this.tokenRepository
        .createQueryBuilder('token')
        .leftJoinAndSelect('token.user', 'user')
        .where('token.token = :refreshToken', { refreshToken })
        .andWhere('token.type = :type', { type: TokenType.REFRESH })
        .andWhere('token.isRevoked = :isRevoked', { isRevoked: false })
        .getOne();

      if (!user || !user.user) {
        throw new Error('用户不存在');
      }

      // 生成新的访问令牌
      return this.generateAccessToken(user.user);
    } catch (error) {
      this.logger.error(`刷新令牌失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 撤销令牌
   * @param token 令牌
   * @returns 操作结果
   */
  async revokeToken(token: string): Promise<boolean> {
    try {
      const result = await this.tokenRepository.update({ token }, { isRevoked: true });

      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error(`撤销令牌失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 撤销用户的所有令牌
   * @param userId 用户ID
   * @returns 操作结果
   */
  async revokeAllUserTokens(userId: number): Promise<boolean> {
    try {
      const result = await this.tokenRepository.update(
        { user: { id: userId } },
        { isRevoked: true }
      );

      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error(`撤销用户所有令牌失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 清理过期令牌
   */
  async cleanExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      await this.tokenRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :now', { now })
        .execute();

      this.logger.log('已清理过期令牌');
    } catch (error) {
      this.logger.error(`清理过期令牌失败: ${error.message}`);
    }
  }

  /**
   * 保存令牌到数据库
   * @param token 令牌值
   * @param type 令牌类型
   * @param user 用户信息
   */
  private async saveToken(token: string, type: TokenType, user: User): Promise<void> {
    try {
      // 计算过期时间
      let expiresIn: StringValue;
      if (type === TokenType.ACCESS) {
        expiresIn = this.configService.get<StringValue>('JWT_EXPIRES_IN', '15m');
      } else {
        expiresIn = this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN', '7d');
      }

      const expiresAt = new Date();
      const timeValue = parseInt(expiresIn);
      const timeUnit = expiresIn.replace(timeValue.toString(), '');

      if (timeUnit.includes('s')) {
        expiresAt.setSeconds(expiresAt.getSeconds() + timeValue);
      } else if (timeUnit.includes('m')) {
        expiresAt.setMinutes(expiresAt.getMinutes() + timeValue);
      } else if (timeUnit.includes('h')) {
        expiresAt.setHours(expiresAt.getHours() + timeValue);
      } else if (timeUnit.includes('d')) {
        expiresAt.setDate(expiresAt.getDate() + timeValue);
      }

      // 保存令牌
      const tokenEntity = this.tokenRepository.create({
        token,
        type,
        expiresAt,
        user,
      });

      await this.tokenRepository.save(tokenEntity);
    } catch (error) {
      this.logger.error(`保存令牌失败: ${error.message}`);
      throw error;
    }
  }
}
