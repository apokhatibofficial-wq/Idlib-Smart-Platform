import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleProfile {
  googleId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('google.clientId') || 'not-configured',
      clientSecret: config.get<string>('google.clientSecret') || 'not-configured',
      callbackURL:
        config.get<string>('google.callbackUrl') || 'http://localhost:4000/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('لم يتمكن Google من توفير عنوان بريد إلكتروني'), undefined);
    }
    const user: GoogleProfile = {
      googleId: profile.id,
      email,
      fullName: profile.displayName || email.split('@')[0],
      avatarUrl: profile.photos?.[0]?.value,
    };
    // NOTE: this strategy attaches a GoogleProfile to req.user, not the usual
    // AuthenticatedUser shape — only the /auth/google/callback route reads it,
    // where it is explicitly re-cast back to GoogleProfile (see AuthController).
    done(null, user as unknown as Express.User);
  }
}
