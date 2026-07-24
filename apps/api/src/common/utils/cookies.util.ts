import ms from 'ms';
import type { CookieOptions, Response } from 'express';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../constants';

interface CookieContext {
  isProduction: boolean;
  domain?: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

function baseOptions(ctx: CookieContext): CookieOptions {
  return {
    httpOnly: true,
    secure: ctx.isProduction,
    sameSite: 'lax',
    domain: ctx.domain,
    path: '/',
    signed: true,
  };
}

export function setAuthCookies(
  res: Response,
  ctx: CookieContext,
  tokens: { accessToken: string; refreshToken: string },
) {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...baseOptions(ctx),
    maxAge: ms(ctx.accessExpiresIn as ms.StringValue),
  });
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...baseOptions(ctx),
    maxAge: ms(ctx.refreshExpiresIn as ms.StringValue),
    path: '/api/v1/auth',
  });
}

export function clearAuthCookies(res: Response, ctx: CookieContext) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { ...baseOptions(ctx) });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { ...baseOptions(ctx), path: '/api/v1/auth' });
}
