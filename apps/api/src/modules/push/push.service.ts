import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { PUSH_QUEUE } from '../../common/constants';
import type { PushJobData } from '../../queue/processors/push.processor';
import { SubscribeDto } from './dto/subscribe.dto';

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(PUSH_QUEUE) private readonly pushQueue: Queue<PushJobData>,
  ) {}

  vapidPublicKey() {
    return { publicKey: this.config.get<string>('vapid.publicKey') || null };
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { userId, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
      create: { userId, endpoint: dto.endpoint, p256dh: dto.keys.p256dh, auth: dto.keys.auth },
    });
    return { subscribed: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
    return { subscribed: false };
  }

  /** Fire-and-forget notification to every device a user is subscribed on. */
  async notifyUser(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId } });
      for (const sub of subscriptions) {
        await this.pushQueue.add('send', {
          subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        });
      }
    } catch (err) {
      // Notifications are best-effort — never let a delivery failure break the calling flow.
      this.logger.warn(
        `Failed to enqueue push notification for user ${userId}: ${(err as Error).message}`,
      );
    }
  }
}
