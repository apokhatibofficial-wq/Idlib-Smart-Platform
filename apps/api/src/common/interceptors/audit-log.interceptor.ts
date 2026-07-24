import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { AUDIT_ACTION_KEY } from '../decorators/audit.decorator';
import { AuditLogService } from '../services/audit-log.service';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLog: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = this.reflector.getAllAndOverride<string>(AUDIT_ACTION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!action) return next.handle();

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    const route = request.route as { path?: string | string[] } | undefined;
    const routePath = route?.path;
    const targetId = request.params?.id;

    return next.handle().pipe(
      tap(() => {
        void this.auditLog.log({
          actorId: user?.id,
          action,
          targetType: Array.isArray(routePath) ? routePath[0] : routePath,
          targetId: Array.isArray(targetId) ? targetId[0] : targetId,
          metadata: { params: request.params, query: request.query },
          ip: request.ip,
          userAgent: request.headers['user-agent'],
        });
      }),
    );
  }
}
