import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { UploadsService } from './uploads.service';

const HARD_CAP_BYTES = 15 * 1024 * 1024;

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post()
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: HARD_CAP_BYTES } }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Query('kind') kind: string) {
    if (kind !== 'image' && kind !== 'video') {
      throw new BadRequestException('نوع الملف (kind) يجب أن يكون image أو video');
    }
    return this.uploads.store(file, kind);
  }
}
