import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BusinessAccountStatus } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CreateBusinessAccountDto } from './dto/create-business-account.dto';
import { RejectBusinessAccountDto } from './dto/review-business-account.dto';

@Injectable()
export class BusinessAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  feeUsd() {
    return this.config.get<number>('businessAccountFeeUsd')!;
  }

  async getMine(userId: string) {
    return this.prisma.businessAccountRequest.findFirst({
      where: { applicantId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateBusinessAccountDto) {
    const existingStore = await this.prisma.store.findUnique({ where: { ownerId: userId } });
    if (existingStore) throw new BadRequestException('لديك حساب تجاري بالفعل');

    const pending = await this.prisma.businessAccountRequest.findFirst({
      where: { applicantId: userId, status: { in: ['PENDING_PAYMENT', 'PENDING_APPROVAL'] } },
    });
    if (pending) throw new BadRequestException('لديك طلب تحويل لحساب أعمال قيد المراجعة بالفعل');

    const request = await this.prisma.businessAccountRequest.create({
      data: {
        applicantId: userId,
        businessName: dto.businessName,
        registrationNumber: dto.registrationNumber,
        phone: dto.phone,
        category: dto.category,
        logoUrl: dto.logoUrl,
        photoUrls: dto.photoUrls ?? [],
        description: dto.description,
        firstProductName: dto.firstProductName,
        firstProductPrice: dto.firstProductPrice,
        firstProductAvailable: dto.firstProductAvailable,
        feeUsd: this.feeUsd(),
        // No online payment gateway is wired up yet (none was provided in the brief) — the
        // request goes straight to admin review, whose approval action stands in for both
        // "payment confirmed" and "account approved", matching the two-button admin UI.
        status: BusinessAccountStatus.PENDING_APPROVAL,
      },
    });

    await this.auditLog.log({
      actorId: userId,
      action: 'business_account.request',
      targetType: 'business_account_request',
      targetId: request.id,
    });

    return request;
  }

  async listPending() {
    return this.prisma.businessAccountRequest.findMany({
      where: { status: BusinessAccountStatus.PENDING_APPROVAL },
      include: { applicant: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approve(requestId: string, adminId: string) {
    const request = await this.prisma.businessAccountRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('الطلب غير موجود');
    if (request.status !== BusinessAccountStatus.PENDING_APPROVAL) {
      throw new BadRequestException('تمت مراجعة هذا الطلب مسبقًا');
    }

    const [, , , store] = await this.prisma.$transaction([
      this.prisma.businessAccountRequest.update({
        where: { id: requestId },
        data: {
          status: BusinessAccountStatus.APPROVED,
          paidAt: request.paidAt ?? new Date(),
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.user.update({ where: { id: request.applicantId }, data: { role: 'MERCHANT' } }),
      this.prisma.auditLog.create({
        data: {
          actorId: adminId,
          action: 'business_account.approve',
          targetType: 'business_account_request',
          targetId: requestId,
        },
      }),
      this.prisma.store.create({
        data: {
          ownerId: request.applicantId,
          name: request.businessName,
          category: request.category,
          description: request.description,
          logoUrl: request.logoUrl,
          deliveryAvailable: false,
          products: {
            create: [
              {
                name: request.firstProductName,
                price: request.firstProductPrice,
                availability: request.firstProductAvailable,
              },
            ],
          },
        },
      }),
    ]);

    await this.prisma.businessAccountRequest.update({
      where: { id: requestId },
      data: { resultingStoreId: store.id },
    });

    return { request: { ...request, status: BusinessAccountStatus.APPROVED }, store };
  }

  async reject(requestId: string, adminId: string, dto: RejectBusinessAccountDto) {
    const request = await this.prisma.businessAccountRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('الطلب غير موجود');
    if (request.status !== BusinessAccountStatus.PENDING_APPROVAL) {
      throw new BadRequestException('تمت مراجعة هذا الطلب مسبقًا');
    }

    const updated = await this.prisma.businessAccountRequest.update({
      where: { id: requestId },
      data: {
        status: BusinessAccountStatus.REJECTED,
        rejectionReason: dto.reason,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });

    await this.auditLog.log({
      actorId: adminId,
      action: 'business_account.reject',
      targetType: 'business_account_request',
      targetId: requestId,
      metadata: { reason: dto.reason },
    });

    return updated;
  }
}
