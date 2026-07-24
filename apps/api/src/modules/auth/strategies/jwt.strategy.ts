import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ACCESS_TOKEN_COOKIE } from '../../../common/constants';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  username: string;
}

function cookieExtractor(req: Request): string | null {
  const signed = req?.signedCookies as Record<string, string> | undefined;
  const unsigned = req?.cookies as Record<string, string> | undefined;
  return signed?.[ACCESS_TOKEN_COOKIE] ?? unsigned?.[ACCESS_TOKEN_COOKIE] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessTokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, username: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('الحساب غير موجود أو معطّل');
    }
    return { id: user.id, email: user.email, role: user.role, username: user.username };
  }
}
