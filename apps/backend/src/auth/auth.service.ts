import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { User } from '../user/entity/user.entity';
import { UserService } from '../user/user.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService
  ) {}

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @returns 登录结果，包含令牌和用户信息
   */
  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

    try {
      // 1. 查找用户
      const user = await this.userService.findByUsername(username);
      if (!user) {
        throw new BadRequestException('用户名或密码错误');
      }

      // 2. 验证密码
      const isPasswordValid = await this.userService.validatePassword(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('用户名或密码错误');
      }

      // 3. 生成访问令牌和刷新令牌
      const accessToken = await this.tokenService.generateAccessToken(user);
      const refreshToken = await this.tokenService.generateRefreshToken(user);

      // 4. 返回登录结果
      return {
        accessToken,
        refreshToken,
        userId: user.id,
        username: user.username,
      };
    } catch (error) {
      this.logger.error(`登录失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 刷新访问令牌
   * @param refreshTokenDto 刷新令牌信息
   * @returns 新的访问令牌
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      // 验证刷新令牌并生成新的访问令牌
      const accessToken = await this.tokenService.refreshAccessToken(refreshToken);

      return {
        accessToken,
      };
    } catch (error) {
      this.logger.error(`刷新令牌失败: ${error.message}`);
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 用户登出
   * @param accessToken 访问令牌
   * @param refreshToken 刷新令牌
   * @returns 操作结果
   */
  async logout(accessToken: string, refreshToken?: string): Promise<boolean> {
    try {
      // 撤销访问令牌
      await this.tokenService.revokeToken(accessToken);

      // 如果提供了刷新令牌，也撤销它
      if (refreshToken) {
        await this.tokenService.revokeToken(refreshToken);
      }

      return true;
    } catch (error) {
      this.logger.error(`登出失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 用户登出所有设备
   * @param userId 用户ID
   * @returns 操作结果
   */
  async logoutAll(userId: number): Promise<boolean> {
    try {
      // 撤销用户的所有令牌
      return await this.tokenService.revokeAllUserTokens(userId);
    } catch (error) {
      this.logger.error(`登出所有设备失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取当前用户信息
   * @param userId 用户ID
   * @returns 用户信息
   */
  async getCurrentUser(userId: number): Promise<Partial<User>> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      return user;
    } catch (error) {
      this.logger.error(`获取当前用户信息失败: ${error.message}`);
      throw error;
    }
  }
}
