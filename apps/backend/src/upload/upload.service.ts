import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UploadResponseDto } from './dto/upload-response.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;
  private readonly siteUrl: string;
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.siteUrl = this.configService.get<string>('SITE_URL') || 'http://localhost:3000';
    this.maxFileSize = parseInt(this.configService.get<string>('MAX_FILE_SIZE') || '5242880'); // 默认5MB
    this.allowedFileTypes = (
      this.configService.get<string>('ALLOWED_FILE_TYPES') ||
      'image/jpeg,image/png,image/gif,application/pdf,text/plain'
    ).split(',');

    // 确保上传目录存在
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error('创建上传目录失败', error);
      throw new InternalServerErrorException('文件上传服务初始化失败');
    }
  }

  private async createDailyDir(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const dailyDir = join(this.uploadDir, String(year), month, day);

    try {
      await fs.mkdir(dailyDir, { recursive: true });
      return dailyDir;
    } catch (error) {
      this.logger.error('创建日期目录失败', error);
      throw new InternalServerErrorException('文件上传失败');
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const ext = extname(originalName);
    return `${uuidv4()}${ext}`;
  }

  private getFileExtension(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'text/plain': '.txt',
    };

    return mimeToExt[mimeType] || '';
  }

  private validateFile(file: Express.Multer.File): void {
    // 检查文件大小
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`文件大小超过限制 (${this.maxFileSize / 1024 / 1024}MB)`);
    }

    // 检查文件类型
    if (!this.allowedFileTypes.includes(file.mimetype)) {
      throw new BadRequestException('不支持的文件类型');
    }
  }

  private getRelativePath(fullPath: string): string {
    // 获取相对于上传目录的路径
    return fullPath.replace(this.uploadDir, '').replace(/^[\\/]/, '');
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResponseDto> {
    // 验证文件
    this.validateFile(file);

    // 创建日期目录
    const dailyDir = await this.createDailyDir();

    // 生成唯一文件名
    const uniqueFilename = this.generateUniqueFilename(file.originalname);
    const filePath = join(dailyDir, uniqueFilename);

    try {
      // 将文件写入磁盘
      await fs.writeFile(filePath, file.buffer);

      // 获取相对路径
      const relativePath = this.getRelativePath(filePath);

      // 构建完整URL
      const fullUrl = `${this.siteUrl}/${relativePath}`;

      return {
        filename: uniqueFilename,
        originalName: file.originalname,
        url: fullUrl,
        size: file.size,
      };
    } catch (error) {
      this.logger.error('文件上传失败', error);
      throw new InternalServerErrorException('文件上传失败');
    }
  }
}
