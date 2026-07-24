import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';
import { CryptoService } from './services/crypto.service';
import { MailService } from './services/mail.service';

@Global()
@Module({
  providers: [CryptoService, AuditLogService, MailService],
  exports: [CryptoService, AuditLogService, MailService],
})
export class CommonModule {}
