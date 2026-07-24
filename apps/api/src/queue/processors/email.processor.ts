import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { EMAIL_QUEUE } from '../../common/constants';
import { MailService, SendMailInput } from '../../common/services/mail.service';

@Processor(EMAIL_QUEUE)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mail: MailService) {
    super();
  }

  async process(job: Job<SendMailInput>): Promise<void> {
    await this.mail.sendMail(job.data);
    this.logger.log(`Email job ${job.id} delivered to ${job.data.to}`);
  }
}
