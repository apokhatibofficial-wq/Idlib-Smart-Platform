import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { configuration } from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessAccountsModule } from './modules/business-accounts/business-accounts.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { ChatModule } from './modules/chat/chat.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { NewsModule } from './modules/news/news.module';
import { AdminModule } from './modules/admin/admin.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PushModule } from './modules/push/push.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    CommonModule,
    QueueModule,
    AuthModule,
    UsersModule,
    BusinessAccountsModule,
    ComplaintsModule,
    MarketplaceModule,
    ChatModule,
    AssistantModule,
    NewsModule,
    AdminModule,
    MerchantModule,
    UploadsModule,
    PushModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
