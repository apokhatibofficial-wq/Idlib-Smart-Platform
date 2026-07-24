import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CryptoService } from '../../common/services/crypto.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { ChatService } from '../chat/chat.service';
import { PushService } from '../push/push.service';
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_PRIORITY_LABELS,
  COMPLAINT_STATUS_LABELS,
  formatComplaintDisplayId,
} from './complaints.constants';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-status.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly auditLog: AuditLogService,
    private readonly chat: ChatService,
    private readonly push: PushService,
  ) {}

  async create(userId: string, dto: CreateComplaintDto) {
    const complaint = await this.prisma.complaint.create({
      data: {
        citizenId: userId,
        category: dto.category,
        priority: dto.priority,
        description: dto.description,
        locationLabel: dto.locationLabel ?? 'تم تحديده تلقائيًا',
        latitude: dto.latitude,
        longitude: dto.longitude,
        employeeNameEnc: this.crypto.encryptOrNull(dto.employeeName),
        witness1Enc: this.crypto.encryptOrNull(dto.witness1),
        witness2Enc: this.crypto.encryptOrNull(dto.witness2),
        attachments: dto.attachments?.length
          ? {
              create: dto.attachments.map((a) => ({
                url: a.url,
                kind: a.kind,
                mimeType: a.mimeType,
                sizeBytes: a.sizeBytes,
              })),
            }
          : undefined,
        statusEvents: { create: [{ status: ComplaintStatus.UNDER_REVIEW, changedById: userId }] },
        conversation: {
          create: {
            type: 'COMPLAINT_THREAD',
            participants: { create: [{ userId }] },
            messages: {
              create: [{ body: `تم استلام بلاغكم وهو الآن قيد الدراسة.`, senderId: null }],
            },
          },
        },
      },
      include: { attachments: true },
    });

    await this.auditLog.log({
      actorId: userId,
      action: 'complaint.create',
      targetType: 'complaint',
      targetId: complaint.id,
      metadata: { category: complaint.category, priority: complaint.priority },
    });

    return this.toDto(complaint, Role.CITIZEN);
  }

  async listMine(userId: string) {
    const complaints = await this.prisma.complaint.findMany({
      where: { citizenId: userId },
      orderBy: { createdAt: 'desc' },
    });
    return complaints.map((c) => this.toDto(c, Role.CITIZEN));
  }

  async listAll(status?: ComplaintStatus) {
    const complaints = await this.prisma.complaint.findMany({
      where: status ? { status } : undefined,
      include: { citizen: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return complaints.map((c) => this.toDto(c, Role.ADMIN));
  }

  async getOne(id: string, requester: { id: string; role: Role }) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { attachments: true, statusEvents: { orderBy: { createdAt: 'asc' } } },
    });
    if (!complaint) throw new NotFoundException('البلاغ غير موجود');
    const isOwner = complaint.citizenId === requester.id;
    if (requester.role !== Role.ADMIN && !isOwner) {
      throw new ForbiddenException();
    }
    return this.toDto(complaint, requester.role);
  }

  async updateStatus(id: string, dto: UpdateComplaintStatusDto, adminId: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new NotFoundException('البلاغ غير موجود');

    const [updated] = await this.prisma.$transaction([
      this.prisma.complaint.update({ where: { id }, data: { status: dto.status } }),
      this.prisma.complaintStatusEvent.create({
        data: { complaintId: id, status: dto.status, note: dto.note, changedById: adminId },
      }),
    ]);

    const conversation = await this.prisma.conversation.findUnique({
      where: { relatedComplaintId: id },
    });
    if (conversation) {
      await this.chat.postSystemMessage(
        conversation.id,
        `تم تحديث حالة البلاغ إلى: ${COMPLAINT_STATUS_LABELS[dto.status]}${dto.note ? ` — ${dto.note}` : ''}`,
      );
    }

    await this.auditLog.log({
      actorId: adminId,
      action: 'complaint.update_status',
      targetType: 'complaint',
      targetId: id,
      metadata: { from: complaint.status, to: dto.status },
    });

    await this.push.notifyUser(complaint.citizenId, {
      title: 'تحديث على بلاغك',
      body: `بلاغ #${formatComplaintDisplayId(complaint.sequenceNumber)}: ${COMPLAINT_STATUS_LABELS[dto.status]}`,
      url: '/complaints/' + id,
      tag: `complaint-${id}`,
    });

    return this.toDto(updated, Role.ADMIN);
  }

  categories() {
    return Object.entries(COMPLAINT_CATEGORY_LABELS).map(([key, label]) => ({ key, label }));
  }

  private toDto(
    complaint: {
      id: string;
      sequenceNumber: number;
      category: keyof typeof COMPLAINT_CATEGORY_LABELS;
      status: ComplaintStatus;
      priority: keyof typeof COMPLAINT_PRIORITY_LABELS;
      description: string;
      locationLabel: string | null;
      latitude: unknown;
      longitude: unknown;
      employeeNameEnc?: string | null;
      witness1Enc?: string | null;
      witness2Enc?: string | null;
      createdAt: Date;
      updatedAt: Date;
      attachments?: { id: string; url: string; kind: string; mimeType: string }[];
      statusEvents?: { status: ComplaintStatus; note: string | null; createdAt: Date }[];
      citizen?: { fullName: string; email: string };
    },
    viewerRole: Role,
  ) {
    const isAdmin = viewerRole === Role.ADMIN;
    return {
      id: complaint.id,
      displayId: formatComplaintDisplayId(complaint.sequenceNumber),
      category: complaint.category,
      categoryLabel: COMPLAINT_CATEGORY_LABELS[complaint.category],
      status: complaint.status,
      statusLabel: COMPLAINT_STATUS_LABELS[complaint.status],
      priority: complaint.priority,
      priorityLabel: COMPLAINT_PRIORITY_LABELS[complaint.priority],
      description: complaint.description,
      locationLabel: complaint.locationLabel,
      latitude: complaint.latitude,
      longitude: complaint.longitude,
      attachments: complaint.attachments ?? [],
      statusEvents: complaint.statusEvents ?? [],
      citizen: complaint.citizen,
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      // Bribery whistleblower fields are only ever decrypted for admin case-handlers.
      ...(complaint.category === 'BRIBERY' && isAdmin
        ? {
            employeeName: this.crypto.decryptOrNull(complaint.employeeNameEnc),
            witness1: this.crypto.decryptOrNull(complaint.witness1Enc),
            witness2: this.crypto.decryptOrNull(complaint.witness2Enc),
          }
        : {}),
    };
  }
}
