import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PUBLIC_USER_SELECT } from '../../common/utils/user.util';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...PUBLIC_USER_SELECT,
        store: { select: { id: true, name: true, category: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.username) {
      const existing = await this.prisma.user.findUnique({ where: { username: dto.username } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('اسم المستخدم هذا مستخدم بالفعل');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: dto.fullName, username: dto.username, phone: dto.phone },
      select: PUBLIC_USER_SELECT,
    });

    await this.auditLog.log({
      actorId: userId,
      action: 'user.update_profile',
      targetType: 'user',
      targetId: userId,
    });
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new BadRequestException('لا يمكن تغيير كلمة المرور لحساب مسجّل عبر Google');
    }
    const valid = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!valid) throw new BadRequestException('كلمة المرور الحالية غير صحيحة');

    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditLog.log({
      actorId: userId,
      action: 'user.change_password',
      targetType: 'user',
      targetId: userId,
    });
    return { message: 'تم تحديث كلمة المرور بنجاح' };
  }
}
