import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Thin nodemailer wrapper targeting GoDaddy Workspace Email SMTP (or any SMTP relay).
 * When SMTP credentials are not configured (local dev), mail is logged instead of sent
 * so the rest of the auth flow (OTP, password reset) remains testable without secrets.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    if (this.config.get<boolean>('smtp.configured')) {
      this.transporter = nodemailer.createTransport({
        host: this.config.get<string>('smtp.host'),
        port: this.config.get<number>('smtp.port'),
        secure: this.config.get<boolean>('smtp.secure'),
        auth: {
          user: this.config.get<string>('smtp.user'),
          pass: this.config.get<string>('smtp.password'),
        },
      });
    } else {
      this.logger.warn('SMTP is not configured — outgoing email will be logged, not sent.');
    }
  }

  async sendMail(input: SendMailInput): Promise<void> {
    const fromName = this.config.get<string>('smtp.fromName');
    const fromEmail = this.config.get<string>('smtp.fromEmail');

    if (!this.transporter) {
      this.logger.log(
        `[DEV EMAIL] to=${input.to} subject="${input.subject}"\n${input.text ?? input.html}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}
