import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { REFRESH_TOKEN_COOKIE } from '../../common/constants';
import { clearAuthCookies, setAuthCookies } from '../../common/utils/cookies.util';
import type { AuthenticatedUser } from '../../common/types/express-request';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResendOtpDto, VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleProfile } from './strategies/google.strategy';
import { RefreshTokenPayload } from './strategies/jwt-refresh.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  private cookieCtx() {
    return {
      isProduction: this.config.get<boolean>('isProduction')!,
      domain: this.config.get<string>('cookie.domain'),
      accessExpiresIn: this.config.get<string>('jwt.accessExpiresIn')!,
      refreshExpiresIn: this.config.get<string>('jwt.refreshExpiresIn')!,
    };
  }

  private requestCtx(req: Request) {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-otp')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.auth.verifyOtp(
      dto,
      this.requestCtx(req),
    );
    setAuthCookies(res, this.cookieCtx(), { accessToken, refreshToken });
    return { user };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.auth.resendOtp(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.auth.login(dto, this.requestCtx(req));
    setAuthCookies(res, this.cookieCtx(), { accessToken, refreshToken });
    return { user };
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google; handler body never executes.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as unknown as GoogleProfile;
    const { accessToken, refreshToken } = await this.auth.loginWithGoogle(
      profile,
      this.requestCtx(req),
    );
    setAuthCookies(res, this.cookieCtx(), { accessToken, refreshToken });
    res.redirect(302, `${this.config.get<string>('webUrl')}/home`);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const payload = req.user as unknown as RefreshTokenPayload & { raw: string };
    const { accessToken, refreshToken, user } = await this.auth.refreshTokens(
      payload.jti,
      payload.raw,
      this.requestCtx(req),
    );
    setAuthCookies(res, this.cookieCtx(), { accessToken, refreshToken });
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const signed = req.signedCookies as Record<string, string> | undefined;
    const unsigned = req.cookies as Record<string, string> | undefined;
    const raw = signed?.[REFRESH_TOKEN_COOKIE] ?? unsigned?.[REFRESH_TOKEN_COOKIE];
    if (raw) {
      try {
        const decoded = this.jwt.decode<RefreshTokenPayload>(raw);
        await this.auth.logout(decoded?.jti);
      } catch {
        // Malformed cookie — nothing to revoke server-side, still clear it below.
      }
    }
    clearAuthCookies(res, this.cookieCtx());
    return { message: 'تم تسجيل الخروج' };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getById(user.id);
  }
}
