import 'reflect-metadata';
import { resolve } from 'node:path';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import type { Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.useStaticAssets(resolve(process.cwd(), config.get<string>('upload.dir')!), {
    prefix: '/uploads',
    maxAge: '7d',
    // Attachments are user-supplied media — never execute them, never expose the source dir.
    setHeaders: (res: Response) => res.setHeader('Content-Disposition', 'inline'),
  });

  const isProduction = config.get<boolean>('isProduction');
  const corsOrigins = config.get<string[]>('corsOrigins')!;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: isProduction ? { maxAge: 15552000, includeSubDomains: true, preload: true } : false,
    }),
  );
  app.use(compression());
  app.use(cookieParser(config.get<string>('cookie.secret')));

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties — prevents mass-assignment of unexpected fields
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.set('trust proxy', 1);
  app.enableShutdownHooks();

  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Idlib Smart Platform API')
      .setDescription('منصة إدلب الذكية — REST API (dev only; disabled in production)')
      .setVersion('1.0')
      .addCookieAuth('idlib_at')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.get<number>('port')!;
  await app.listen(port);

  console.log(`🚀 Idlib Smart Platform API listening on port ${port} [${config.get('env')}]`);
}

bootstrap().catch((err: unknown) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
