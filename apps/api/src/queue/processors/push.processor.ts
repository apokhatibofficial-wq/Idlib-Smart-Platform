import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import webpush from 'web-push';
import { PUSH_QUEUE } from '../../common/constants';

export interface PushJobData {
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  payload: { title: string; body: string; url?: string; tag?: string };
}

@Processor(PUSH_QUEUE)
export class PushProcessor extends WorkerHost {
  private readonly logger = new Logger(PushProcessor.name);
  private readonly configured: boolean;

  constructor(private readonly config: ConfigService) {
    super();
    this.configured = Boolean(this.config.get<boolean>('vapid.configured'));
    if (this.configured) {
      webpush.setVapidDetails(
        this.config.get<string>('vapid.subject')!,
        this.config.get<string>('vapid.publicKey')!,
        this.config.get<string>('vapid.privateKey')!,
      );
    } else {
      this.logger.warn(
        'VAPID keys are not configured — push notifications will be logged, not delivered.',
      );
    }
  }

  async process(job: Job<PushJobData>): Promise<void> {
    const { subscription, payload } = job.data;

    if (!this.configured) {
      this.logger.log(`[DEV PUSH] to=${subscription.endpoint} payload=${JSON.stringify(payload)}`);
      return;
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      // 404/410 = the subscription is gone (user revoked permission / uninstalled) — not a retry-able error.
      if (statusCode === 404 || statusCode === 410) {
        this.logger.warn(`Push subscription expired, endpoint=${subscription.endpoint}`);
        return;
      }
      throw err;
    }
  }
}
