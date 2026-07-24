import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Field-level encryption for sensitive-at-rest data (e.g. bribery-report witness
 * identities). AES-256-GCM with a per-value random IV; ciphertext is packed as
 * `iv.authTag.data` (base64url) so it round-trips as a single opaque string column.
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const b64Key = config.get<string>('fieldEncryptionKey')!;
    this.key = Buffer.from(b64Key, 'base64');
    if (this.key.length !== 32) {
      throw new Error('FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256)');
    }
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new Error('Malformed encrypted payload');
    }
    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(tagB64, 'base64url');
    const data = Buffer.from(dataB64, 'base64url');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString('utf8');
  }

  encryptOrNull(plainText?: string | null): string | null {
    if (!plainText) return null;
    return this.encrypt(plainText);
  }

  decryptOrNull(payload?: string | null): string | null {
    if (!payload) return null;
    return this.decrypt(payload);
  }
}
