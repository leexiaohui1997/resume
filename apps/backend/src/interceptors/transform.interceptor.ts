import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { ResponseCode, ResponseTemplate } from '../common/config/base';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseTemplate<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<ResponseTemplate<T>> {
    return next.handle().pipe(
      map(data => ({
        code: ResponseCode.SUCCESS,
        message: 'success',
        data,
        timestamp: Date.now(),
      }))
    );
  }
}
