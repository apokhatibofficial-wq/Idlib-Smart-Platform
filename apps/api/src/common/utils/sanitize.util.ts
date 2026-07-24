import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/** Strips all HTML/script content from user-supplied free text, leaving plain text only. */
export function sanitizePlainText(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

/**
 * class-validator/transformer field decorator: sanitizes free-text DTO fields
 * (complaint descriptions, chat messages, business/product descriptions, names)
 * against stored-XSS payloads, independent of React's output-side auto-escaping.
 * Do NOT apply to passwords, tokens, or codes — sanitization must never alter them.
 */
export function SanitizeText(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? sanitizePlainText(value) : value,
  );
}
