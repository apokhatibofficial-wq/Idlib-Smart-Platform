import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/services/audit-log.service';
import { CreateAlertDto, CreateNewsDto } from './dto/create-news.dto';

const NEWS_TIME_FORMAT = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' });

function relativeArabicTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (Math.abs(diffHours) < 24) return NEWS_TIME_FORMAT.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return NEWS_TIME_FORMAT.format(diffDays, 'day');
}

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listNews(limit = 20) {
    const items = await this.prisma.newsItem.findMany({
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });
    return items.map((n) => ({ ...n, time: relativeArabicTime(n.publishedAt) }));
  }

  async createNews(adminId: string, dto: CreateNewsDto) {
    const news = await this.prisma.newsItem.create({
      data: { ...dto, authorId: adminId },
    });
    await this.auditLog.log({
      actorId: adminId,
      action: 'news.create',
      targetType: 'news_item',
      targetId: news.id,
    });
    return news;
  }

  async listAlerts() {
    return this.prisma.alert.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAlert(adminId: string, dto: CreateAlertDto) {
    const alert = await this.prisma.alert.create({ data: { text: dto.text } });
    await this.auditLog.log({
      actorId: adminId,
      action: 'alert.create',
      targetType: 'alert',
      targetId: alert.id,
    });
    return alert;
  }
}
