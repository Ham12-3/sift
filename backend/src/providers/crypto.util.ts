import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/** Derives a stable 32-byte key from the configured ENCRYPTION_KEY (any length). */
function keyFromEnv(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? '';
  // SHA-256 always yields exactly 32 bytes, so operators can use any key string.
  return createHash('sha256').update(raw).digest();
}

/**
 * Encrypts a secret for storage. Output format: ivHex:authTagHex:cipherHex.
 * AES-256-GCM gives us confidentiality + tamper detection.
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, keyFromEnv(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Malformed encrypted secret');
  }
  const decipher = createDecipheriv(ALGORITHM, keyFromEnv(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

/** A non-reversible hint (last 4 chars) so the UI can show "sk-...abcd". */
export function maskHint(plaintext: string): string {
  if (!plaintext) return '';
  const tail = plaintext.slice(-4);
  return `••••${tail}`;
}
