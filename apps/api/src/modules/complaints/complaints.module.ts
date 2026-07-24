import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { PushModule } from '../push/push.module';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';

@Module({
  imports: [ChatModule, PushModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService],
})
export class ComplaintsModule {}
