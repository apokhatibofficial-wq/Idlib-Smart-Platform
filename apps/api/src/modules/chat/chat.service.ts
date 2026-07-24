import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  COMPLAINT_CATEGORY_LABELS,
  formatComplaintDisplayId,
} from '../complaints/complaints.constants';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, fullName: true } } } },
            relatedComplaint: { select: { sequenceNumber: true, category: true } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    return Promise.all(
      participations.map(async (p) => {
        const convo = p.conversation;
        const other = convo.participants.find((x) => x.userId !== userId);
        const unread = await this.prisma.message.count({
          where: {
            conversationId: convo.id,
            createdAt: { gt: p.lastReadAt ?? new Date(0) },
            NOT: { senderId: userId },
          },
        });

        let name = convo.title ?? other?.user.fullName ?? 'محادثة';
        if (convo.type === 'COMPLAINT_THREAD' && convo.relatedComplaint) {
          name = `بلاغ #${formatComplaintDisplayId(convo.relatedComplaint.sequenceNumber)} - ${COMPLAINT_CATEGORY_LABELS[convo.relatedComplaint.category]}`;
        }

        return {
          id: convo.id,
          type: convo.type,
          name,
          last: convo.messages[0]?.body ?? '',
          time: convo.messages[0]?.createdAt ?? convo.createdAt,
          unread,
        };
      }),
    );
  }

  async getThread(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('لا تملك صلاحية الوصول لهذه المحادثة');

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        relatedComplaint: { select: { sequenceNumber: true, category: true } },
        messages: { orderBy: { createdAt: 'asc' } },
        participants: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });
    if (!conversation) throw new NotFoundException('المحادثة غير موجودة');

    await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    const other = conversation.participants.find((x) => x.userId !== userId);
    let name = conversation.title ?? other?.user.fullName ?? 'محادثة';
    if (conversation.type === 'COMPLAINT_THREAD' && conversation.relatedComplaint) {
      name = `بلاغ #${formatComplaintDisplayId(conversation.relatedComplaint.sequenceNumber)} - ${COMPLAINT_CATEGORY_LABELS[conversation.relatedComplaint.category]}`;
    }

    return {
      id: conversation.id,
      name,
      messages: conversation.messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderId === userId,
        system: m.senderId === null,
        createdAt: m.createdAt,
      })),
    };
  }

  async sendMessage(userId: string, conversationId: string, body: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participant) throw new ForbiddenException('لا تملك صلاحية الوصول لهذه المحادثة');

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId, senderId: userId, body } }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
      this.prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { lastReadAt: new Date() },
      }),
    ]);

    return {
      id: message.id,
      body: message.body,
      mine: true,
      system: false,
      createdAt: message.createdAt,
    };
  }

  /** Used by other modules (marketplace) to open/reuse a merchant<->citizen thread. */
  async findOrCreateDirectConversation(userIdA: string, userIdB: string, title?: string) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId: userIdA } } },
          { participants: { some: { userId: userIdB } } },
        ],
      },
    });
    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        type: 'DIRECT',
        title,
        participants: { create: [{ userId: userIdA }, { userId: userIdB }] },
      },
    });
  }

  async postSystemMessage(conversationId: string, body: string) {
    await this.prisma.$transaction([
      this.prisma.message.create({ data: { conversationId, senderId: null, body } }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
  }
}
