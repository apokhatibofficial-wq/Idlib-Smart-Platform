import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessAccountStatus, ComplaintStatus, CouponStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { PUBLIC_USER_SELECT } from '../../common/utils/user.util';

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
