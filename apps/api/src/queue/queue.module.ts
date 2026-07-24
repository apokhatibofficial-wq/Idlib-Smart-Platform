import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EMAIL_QUEUE, PUSH_QUEUE } from '../common/constants';
import { EmailProcessor } from './processors/email.processor';
import { PushProcessor } from './processors/push.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: new Redis(config.get<string>('redis.url')!, { maxRetriesPerRequest: null }),
      }),
    }),
    BullModule.registerQueue({ name: EMAIL_QUEUE }, { name: PUSH_QUEUE }),
  ],
  providers: [EmailProcessor, PushProcessor],
  exports: [BullModule],
})
export class QueueModule {}
