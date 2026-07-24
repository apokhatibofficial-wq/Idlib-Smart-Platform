import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(
            `${request.method} ${request.originalUrl} ${response.statusCode} +${ms}ms`,
          );
        },
        error: (err: unknown) => {
          const ms = Date.now() - start;
          const status = response.statusCode || 500;
          this.logger.warn(
            `${request.method} ${request.originalUrl} ${status} +${ms}ms — ${
              err instanceof Error ? err.message : 'unknown error'
            }`,
          );
        },
      }),
    );
  }
}
