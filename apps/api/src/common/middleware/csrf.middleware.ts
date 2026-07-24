import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { CSRF_COOKIE, CSRF_HEADER, SAFE_METHODS } from '../constants';
import { randomToken, safeEqual } from '../utils/hash.util';

/**
 * Double-submit-cookie CSRF protection. A readable (non-httpOnly) token cookie is
 * issued on first contact; every state-changing request must echo it back in the
 * `x-csrf-token` header. Cross-site requests cannot read the cookie (browser SOP),
 * so they cannot produce a matching header, regardless of the ambient auth cookies.
 */
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    let token = req.cookies?.[CSRF_COOKIE] as string | undefined;

    if (!token) {
      token = randomToken(24);
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: this.config.get<boolean>('isProduction'),
        sameSite: 'lax',
        domain: this.config.get<string>('cookie.domain'),
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });
    }

    if (!SAFE_METHODS.has(req.method)) {
      const header = req.headers[CSRF_HEADER] as string | undefined;
      if (!header || !token || !safeEqual(header, token)) {
        throw new ForbiddenException('طلب غير موثّق (CSRF) — أعد تحميل الصفحة والمحاولة مجددًا');
      }
    }

    next();
  }
}
