import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../user/entity/user.entity';
import { AuthService } from './auth.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { TokenBlacklistGuard } from './guards/token-blacklist.guard';
import type { RequestWithUser } from './interfaces/request-with-user.interface';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新访问令牌' })
  @ApiResponse({ status: 200, description: '刷新成功', type: RefreshResponseDto })
  @ApiResponse({ status: 401, description: '刷新令牌无效或已过期' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<RefreshResponseDto> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, TokenBlacklistGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async logout(
    @Request() req: RequestWithUser,
    @Headers('authorization') authHeader?: string
  ): Promise<{ success: boolean }> {
    // 从请求头中提取访问令牌
    let accessToken = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }

    // 从请求体中获取刷新令牌（如果有）
    const { refreshToken } = req.body || {};

    const success = await this.authService.logout(accessToken, refreshToken);
    return { success };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard, TokenBlacklistGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出所有设备' })
  @ApiResponse({ status: 200, description: '登出成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async logoutAll(@Request() req: RequestWithUser): Promise<{ success: boolean }> {
    const { userId } = req.user;
    const success = await this.authService.logoutAll(userId);
    return { success };
  }

  @Get('profile')
  @UseGuards(OptionalJwtAuthGuard, TokenBlacklistGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功', type: User })
  @ApiResponse({ status: 401, description: '未授权' })
  async getCurrentUser(@Request() req: RequestWithUser): Promise<Partial<User> | null> {
    // 如果用户已认证，返回用户信息
    if (req.user) {
      return this.authService.getCurrentUser(req.user.userId);
    }

    // 如果用户未认证，返回null
    return null;
  }
}
