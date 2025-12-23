import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  Injectable,
  ValidationError,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseCode, ResponseTemplate } from '../common/config/base';

@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = ResponseCode.SERVER_ERROR;
    let message = '系统繁忙，请稍后再试';
    let errors: void | Record<string, string[]> = undefined;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const exceptionErrors = (exceptionResponse as { errors: ValidationError[] }).errors;

      status = exception.getStatus();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as { message: string }).message || exception.message;

      if (Array.isArray(exceptionErrors)) {
        errors = exceptionErrors.reduce(
          (acc, error) => {
            return { ...acc, [error.property]: Object.values(error.constraints || {}) };
          },
          {} as Record<string, string[]>
        );
      }
    }

    response.status(status).json({
      code: status,
      message,
      timestamp: Date.now(),
      errors,
    } as ResponseTemplate<void>);
  }
}
