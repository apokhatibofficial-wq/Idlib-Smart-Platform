import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { PushModule } from '../push/push.module';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';

@Module({
  imports: [ChatModule, PushModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
