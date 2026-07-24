/**
 * Minimal, dependency-free magic-byte sniffing for the small, fixed set of
 * upload formats this platform accepts. Deliberately narrow (no generic
 * "detect anything" parser) so there is no unused, potentially vulnerable
 * parsing code for formats we will never accept (see: file-type's historical
 * ASF-parser infinite-loop CVE, GHSA-5v7r-6r5c-r473, which this sidesteps
 * entirely rather than depending on an ESM-only patched major).
 */
export interface DetectedFile {
  mime: string;
  ext: string;
}

function matches(buf: Buffer, offset: number, signature: number[]): boolean {
  if (buf.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buf[offset + i] !== signature[i]) return false;
  }
  return true;
}

function asciiAt(buf: Buffer, offset: number, text: string): boolean {
  if (buf.length < offset + text.length) return false;
  return buf.toString('ascii', offset, offset + text.length) === text;
}

export function detectFileType(buf: Buffer): DetectedFile | null {
  // Images
  if (matches(buf, 0, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' };
  if (matches(buf, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return { mime: 'image/png', ext: 'png' };
  if (asciiAt(buf, 0, 'RIFF') && asciiAt(buf, 8, 'WEBP'))
    return { mime: 'image/webp', ext: 'webp' };

  // Video — ISO base media file format (MP4/QuickTime family): 'ftyp' box at offset 4
  if (asciiAt(buf, 4, 'ftyp')) {
    const brand = buf.toString('ascii', 8, 12);
    if (brand.startsWith('qt')) return { mime: 'video/quicktime', ext: 'mov' };
    return { mime: 'video/mp4', ext: 'mp4' };
  }
  // WebM/Matroska — EBML header
  if (matches(buf, 0, [0x1a, 0x45, 0xdf, 0xa3])) return { mime: 'video/webm', ext: 'webm' };

  return null;
}
