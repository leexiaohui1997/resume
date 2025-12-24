import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getCorsConfig } from './common/config/cors.config';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 获取配置服务
  const configService = app.get(ConfigService);

  // 配置CORS
  app.enableCors(getCorsConfig(configService));

  // 配置静态文件服务
  const uploadDir = configService.get<string>('UPLOAD_DIR') || './uploads';
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
  });

  // 配置Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('简历系统API')
    .setDescription('简历系统后端API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: errors => {
        return new BadRequestException({
          code: 400,
          message: '参数校验失败',
          errors,
        });
      },
    })
  );
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
