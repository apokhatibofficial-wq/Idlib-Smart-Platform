import { Module } from '@nestjs/common';
import { PushModule } from '../push/push.module';
import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';

@Module({
  imports: [PushModule],
  controllers: [MerchantController],
  providers: [MerchantService],
})
export class MerchantModule {}
