import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessAccountStatus, ComplaintStatus, CouponStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PUBLIC_USER_SELECT } from '../../common/utils/user.util';
import { STORE_CATEGORY_LABELS } from '../marketplace/marketplace.constants';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async overview() {
    const [users, openComplaints, pendingBusinessAccounts, publishedNews] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.complaint.count({ where: { status: { not: ComplaintStatus.RESOLVED } } }),
      this.prisma.businessAccountRequest.count({
        where: { status: BusinessAccountStatus.PENDING_APPROVAL },
      }),
      this.prisma.newsItem.count(),
    ]);
    return { users, openComplaints, pendingBusinessAccounts, publishedNews };
  }

  async listUsers() {
    return this.prisma.user.findMany({
      select: PUBLIC_USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserStatus(userId: string, adminId: string, isActive: boolean) {
    if (userId === adminId && !isActive) {
      throw new BadRequestException('لا يمكنك تعطيل حسابك الخاص');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: PUBLIC_USER_SELECT,
    });

    if (!isActive) {
      // Revoke every existing session immediately — deactivating a user must not
      // leave their already-issued refresh tokens usable until they expire naturally.
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.auditLog.log({
      actorId: adminId,
      action: isActive ? 'user.reactivate' : 'user.deactivate',
      targetType: 'user',
      targetId: userId,
    });

    return updated;
  }

  async listStores() {
    const stores = await this.prisma.store.findMany({
      include: { owner: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return stores.map((s) => ({ ...s, categoryLabel: STORE_CATEGORY_LABELS[s.category] }));
  }

  async updateStoreStatus(storeId: string, adminId: string, isActive: boolean) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('المتجر غير موجود');

    const updated = await this.prisma.store.update({ where: { id: storeId }, data: { isActive } });

    await this.auditLog.log({
      actorId: adminId,
      action: isActive ? 'store.reactivate' : 'store.suspend',
      targetType: 'store',
      targetId: storeId,
    });

    return { ...updated, categoryLabel: STORE_CATEGORY_LABELS[updated.category] };
  }

  async logs(page = 1, pageSize = 25) {
    return this.auditLog.list({ page, pageSize });
  }

  async listPendingCoupons() {
    return this.prisma.coupon.findMany({
      where: { status: CouponStatus.PENDING_APPROVAL },
      include: { store: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async reviewCoupon(couponId: string, adminId: string, approve: boolean) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('الكوبون غير موجود');
    if (coupon.status !== CouponStatus.PENDING_APPROVAL) {
      throw new BadRequestException('تمت مراجعة هذا الكوبون مسبقًا');
    }

    const updated = await this.prisma.coupon.update({
      where: { id: couponId },
      data: {
        status: approve ? CouponStatus.PUBLISHED : CouponStatus.REJECTED,
        approvedById: adminId,
      },
    });

    await this.auditLog.log({
      actorId: adminId,
      action: approve ? 'coupon.approve' : 'coupon.reject',
      targetType: 'coupon',
      targetId: couponId,
    });

    return updated;
  }
}
