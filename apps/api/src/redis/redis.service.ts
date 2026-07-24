import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(config: ConfigService) {
    super(config.get<string>('redis.url')!, { lazyConnect: true, maxRetriesPerRequest: 3 });
  }

  async onModuleInit() {
    await this.connect();
    this.logger.log('Connected to Redis');
  }

  onModuleDestroy() {
    this.disconnect();
  }
}
