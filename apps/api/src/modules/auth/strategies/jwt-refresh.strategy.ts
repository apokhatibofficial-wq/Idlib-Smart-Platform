import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { REFRESH_TOKEN_COOKIE } from '../../../common/constants';

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

function cookieExtractor(req: Request): string | null {
  const signed = req?.signedCookies as Record<string, string> | undefined;
  const unsigned = req?.cookies as Record<string, string> | undefined;
  return signed?.[REFRESH_TOKEN_COOKIE] ?? unsigned?.[REFRESH_TOKEN_COOKIE] ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.refreshSecret')!,
      algorithms: ['HS256'],
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshTokenPayload) {
    const raw = cookieExtractor(req);
    if (!raw) throw new UnauthorizedException('رمز التحديث مفقود');
    return { ...payload, raw };
  }
}
