import { createHash, randomBytes, randomInt } from 'node:crypto';

/** One-way SHA-256 digest (hex) — used to store OTP codes / refresh & reset tokens at rest. */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Cryptographically secure URL-safe random token, used for refresh/reset tokens. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** Cryptographically secure numeric OTP (no modulo bias), e.g. "042917". */
export function generateNumericOtp(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

/** Constant-time-ish equality check for hex/base64 digests to avoid short-circuit timing leaks. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
