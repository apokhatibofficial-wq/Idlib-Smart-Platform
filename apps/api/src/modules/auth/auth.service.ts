import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as argon2 from 'argon2';
import ms from 'ms';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { EMAIL_QUEUE } from '../../common/constants';
import { PUBLIC_USER_SELECT } from '../../common/utils/user.util';
import { generateNumericOtp, randomToken, sha256Hex } from '../../common/utils/hash.util';
import { SendMailInput } from '../../common/services/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/forgot-password.dto';
import { LoginThrottleService } from './login-throttle.service';
import { GoogleProfile } from './strategies/google.strategy';

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const OTP_PURPOSE = 'SIGNUP_VERIFICATION' as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly auditLog: AuditLogService,
    private readonly loginThrottle: LoginThrottleService,
    @InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue<SendMailInput>,
  ) {}

  // ---------------------------------------------------------------------
  // Registration & email verification
  // ---------------------------------------------------------------------

  async register(dto: RegisterDto): Promise<{ email: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (existing && existing.emailVerifiedAt) {
      throw new ConflictException('البريد الإلكتروني مستخدم مسبقًا');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    let user;
    if (existing && !existing.emailVerifiedAt) {
      // Resume an abandoned signup instead of dead-ending the user.
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { fullName: dto.fullName, passwordHash },
      });
    } else {
      const username = await this.generateUniqueUsername(dto.email);
      user = await this.prisma.user.create({
        data: { email: dto.email, fullName: dto.fullName, passwordHash, username },
      });
    }

    await this.issueAndSendOtp(user.id, user.email, user.fullName);
    await this.auditLog.log({
      actorId: user.id,
      action: 'auth.register',
      targetType: 'user',
      targetId: user.id,
    });

    return { email: user.email };
  }

  async verifyOtp(dto: VerifyOtpDto, ctx: RequestContext) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new BadRequestException('لا يوجد حساب بهذا البريد الإلكتروني');
    if (user.emailVerifiedAt) throw new BadRequestException('الحساب مفعّل مسبقًا');

    const otp = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, purpose: OTP_PURPOSE, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException('انتهت صلاحية رمز التحقق، يرجى طلب رمز جديد');
    }
    if (otp.attempts >= otp.maxAttempts) {
      throw new BadRequestException('تم تجاوز عدد المحاولات المسموح، يرجى طلب رمز جديد');
    }
    if (sha256Hex(dto.code) !== otp.codeHash) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('رمز التحقق غير صحيح');
    }

    await this.prisma.$transaction([
      this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } }),
      this.prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } }),
    ]);

    await this.auditLog.log({
      actorId: user.id,
      action: 'auth.verify_email',
      targetType: 'user',
      targetId: user.id,
    });

    const tokens = await this.issueTokens(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      ctx,
    );
    return { ...tokens, user: this.toPublicUser({ ...user, emailVerifiedAt: new Date() }) };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('لا يوجد حساب بهذا البريد الإلكتروني');
    if (user.emailVerifiedAt) throw new BadRequestException('الحساب مفعّل مسبقًا');

    const lastOtp = await this.prisma.otpCode.findFirst({
      where: { userId: user.id, purpose: OTP_PURPOSE },
      orderBy: { createdAt: 'desc' },
    });
    const cooldown = this.config.get<number>('otp.resendCooldownSeconds')!;
    if (lastOtp && Date.now() - lastOtp.createdAt.getTime() < cooldown * 1000) {
      const wait = Math.ceil((cooldown * 1000 - (Date.now() - lastOtp.createdAt.getTime())) / 1000);
      throw new HttpException(
        `يرجى الانتظار ${wait} ثانية قبل إعادة الإرسال`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.issueAndSendOtp(user.id, user.email, user.fullName);
    return { email: user.email };
  }

  private async issueAndSendOtp(userId: string, email: string, fullName: string) {
    const length = this.config.get<number>('otp.length')!;
    const ttlSeconds = this.config.get<number>('otp.ttlSeconds')!;
    const maxAttempts = this.config.get<number>('otp.maxAttempts')!;
    const code = generateNumericOtp(length);

    await this.prisma.otpCode.create({
      data: {
        userId,
        purpose: OTP_PURPOSE,
        codeHash: sha256Hex(code),
        maxAttempts,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });

    await this.emailQueue.add('send', {
      to: email,
      subject: 'رمز تفعيل حسابك — منصة إدلب الذكية',
      html: `<div dir="rtl" style="font-family:sans-serif"><p>مرحبًا ${fullName}،</p><p>رمز تفعيل حسابك هو:</p><p style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</p><p>صالح لمدة ${Math.round(ttlSeconds / 60)} دقائق.</p></div>`,
      text: `رمز تفعيل حسابك هو: ${code} (صالح لمدة ${Math.round(ttlSeconds / 60)} دقائق)`,
    });
  }

  // ---------------------------------------------------------------------
  // Login / logout / refresh
  // ---------------------------------------------------------------------

  async login(dto: LoginDto, ctx: RequestContext) {
    await this.loginThrottle.assertNotLocked(dto.email);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const genericError = () =>
      new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');

    if (!user || !user.passwordHash || !user.isActive) {
      await this.loginThrottle.registerFailure(dto.email);
      throw genericError();
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.loginThrottle.registerFailure(dto.email);
      throw genericError();
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException(
        'يرجى تفعيل حسابك عبر رمز التحقق المرسل إلى بريدك الإلكتروني أولًا',
      );
    }

    await this.loginThrottle.reset(dto.email);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.auditLog.log({
      actorId: user.id,
      action: 'auth.login',
      targetType: 'user',
      targetId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    const tokens = await this.issueTokens(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      ctx,
    );
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async loginWithGoogle(profile: GoogleProfile, ctx: RequestContext) {
    let user = await this.prisma.user.findUnique({ where: { googleId: profile.googleId } });

    if (!user) {
      const byEmail = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            googleId: profile.googleId,
            emailVerifiedAt: byEmail.emailVerifiedAt ?? new Date(),
          },
        });
      } else {
        const username = await this.generateUniqueUsername(profile.email);
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            fullName: profile.fullName,
            googleId: profile.googleId,
            authProvider: 'GOOGLE',
            emailVerifiedAt: new Date(),
            username,
          },
        });
      }
    }

    if (!user.isActive) throw new ForbiddenException('هذا الحساب معطّل');

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.auditLog.log({
      actorId: user.id,
      action: 'auth.login_google',
      targetType: 'user',
      targetId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    const tokens = await this.issueTokens(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      ctx,
    );
    return { ...tokens, user: this.toPublicUser(user) };
  }

  async refreshTokens(jti: string, rawToken: string, ctx: RequestContext) {
    const row = await this.prisma.refreshToken.findUnique({ where: { id: jti } });
    if (!row) throw new UnauthorizedException('جلسة غير صالحة، يرجى تسجيل الدخول من جديد');

    if (row.revokedAt) {
      // Reuse of an already-rotated-out refresh token — likely theft. Contain the blast radius.
      await this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('تم اكتشاف نشاط غير معتاد، يرجى تسجيل الدخول من جديد');
    }
    if (row.expiresAt < new Date() || sha256Hex(rawToken) !== row.tokenHash) {
      throw new UnauthorizedException('جلسة غير صالحة، يرجى تسجيل الدخول من جديد');
    }

    const user = await this.prisma.user.findUnique({ where: { id: row.userId } });
    if (!user || !user.isActive) throw new UnauthorizedException('الحساب غير موجود أو معطّل');

    const tokens = await this.issueTokens(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      ctx,
    );
    const newJti = this.jwt.decode<{ jti: string }>(tokens.refreshToken).jti;
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date(), replacedBy: newJti },
    });

    return { ...tokens, user: this.toPublicUser(user) };
  }

  async logout(jti?: string) {
    if (jti) {
      await this.prisma.refreshToken.updateMany({
        where: { id: jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  }

  // ---------------------------------------------------------------------
  // Forgot / reset password
  // ---------------------------------------------------------------------

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user.passwordHash) {
      const rawToken = randomToken(32);
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256Hex(rawToken),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      const resetUrl = `${this.config.get<string>('webUrl')}/reset-password?token=${rawToken}`;
      await this.emailQueue.add('send', {
        to: user.email,
        subject: 'استعادة كلمة المرور — منصة إدلب الذكية',
        html: `<div dir="rtl" style="font-family:sans-serif"><p>مرحبًا ${user.fullName}،</p><p>اضغط على الرابط التالي لإعادة تعيين كلمة المرور (صالح لمدة 30 دقيقة):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>إن لم تطلب ذلك، تجاهل هذه الرسالة.</p></div>`,
        text: `لإعادة تعيين كلمة المرور: ${resetUrl}`,
      });
    }
    // Always return a generic success response — never reveal whether the email exists.
    return {
      message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فستصلك رسالة تحتوي على رابط إعادة التعيين',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = sha256Hex(dto.token);
    const row = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!row || row.consumedAt || row.expiresAt < new Date()) {
      throw new BadRequestException('الرابط غير صالح أو منتهي الصلاحية');
    }

    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditLog.log({
      actorId: row.userId,
      action: 'auth.reset_password',
      targetType: 'user',
      targetId: row.userId,
    });
    return { message: 'تم تحديث كلمة المرور بنجاح' };
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  async issueTokens(
    user: { id: string; email: string; role: string; username: string },
    ctx: RequestContext,
  ): Promise<TokenPair> {
    const accessSecret = this.config.get<string>('jwt.accessSecret')!;
    const accessExpiresIn = this.config.get<string>('jwt.accessExpiresIn')!;
    const refreshSecret = this.config.get<string>('jwt.refreshSecret')!;
    const refreshExpiresIn = this.config.get<string>('jwt.refreshExpiresIn')!;

    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, username: user.username },
      { secret: accessSecret, expiresIn: accessExpiresIn as ms.StringValue },
    );

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      { secret: refreshSecret, expiresIn: refreshExpiresIn as ms.StringValue },
    );

    await this.prisma.refreshToken.create({
      data: {
        id: jti,
        userId: user.id,
        tokenHash: sha256Hex(refreshToken),
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        expiresAt: new Date(Date.now() + ms(refreshExpiresIn as ms.StringValue)),
      },
    });

    return { accessToken, refreshToken };
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  private toPublicUser<T extends Record<string, unknown>>(user: T) {
    const clone = { ...user } as Record<string, unknown>;
    delete clone.passwordHash;
    delete clone.googleId;
    return clone;
  }

  private async generateUniqueUsername(email: string): Promise<string> {
    const base =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, '')
        .slice(0, 24) || 'user';

    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = attempt === 0 ? base : `${base}${Math.floor(Math.random() * 10000)}`;
      const exists = await this.prisma.user.findUnique({ where: { username: candidate } });
      if (!exists) return candidate;
    }
    return `${base}${Date.now()}`;
  }
}
