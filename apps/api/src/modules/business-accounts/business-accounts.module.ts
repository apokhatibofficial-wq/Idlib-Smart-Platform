import { Module } from '@nestjs/common';
import { BusinessAccountsController } from './business-accounts.controller';
import { BusinessAccountsService } from './business-accounts.service';

@Module({
  controllers: [BusinessAccountsController],
  providers: [BusinessAccountsService],
  exports: [BusinessAccountsService],
})
export class BusinessAccountsModule {}
