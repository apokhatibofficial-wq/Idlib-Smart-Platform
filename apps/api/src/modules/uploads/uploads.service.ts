import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { detectFileType } from '../../common/utils/magic-bytes.util';
import { randomToken } from '../../common/utils/hash.util';

export type UploadKind = 'image' | 'video';

const ALLOWED_MIME: Record<UploadKind, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
};

export interface StoredFile {
  url: string;
  mimeType: string;
  sizeBytes: number;
  kind: UploadKind;
}

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {}

  private uploadDir(): string {
    return resolve(process.cwd(), this.config.get<string>('upload.dir')!);
  }

  async store(file: Express.Multer.File, kind: UploadKind): Promise<StoredFile> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('لم يتم إرفاق أي ملف');
    }

    const maxBytes = this.config.get<number>('upload.maxFileSizeMb')! * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `حجم الملف يتجاوز الحد المسموح (${this.config.get('upload.maxFileSizeMb')}MB)`,
      );
    }

    // Sniff the real file signature (magic bytes) — never trust the client-supplied
    // mimetype/extension, which are trivially spoofable.
    const detected = detectFileType(file.buffer);
    if (!detected || !ALLOWED_MIME[kind].includes(detected.mime)) {
      throw new BadRequestException('نوع الملف غير مدعوم أو تالف');
    }

    const dir = this.uploadDir();
    await mkdir(dir, { recursive: true });
    const filename = `${randomToken(16)}.${detected.ext}`;
    await writeFile(join(dir, filename), file.buffer, { mode: 0o640 });

    return { url: `/uploads/${filename}`, mimeType: detected.mime, sizeBytes: file.size, kind };
  }
}
