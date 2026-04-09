import crypto from 'crypto';

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is required');
  }
  // Support 32-byte raw or hex/base64 strings.
  if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) return Buffer.from(key, 'hex');
  try {
    const b64 = Buffer.from(key, 'base64');
    if (b64.length === 32) return b64;
  } catch {
    // ignore
  }
  const utf8 = Buffer.from(key, 'utf8');
  if (utf8.length === 32) return utf8;
  throw new Error('ENCRYPTION_KEY must be 32 bytes (raw), or 64 hex chars, or base64 for 32 bytes');
}

export function encryptText(plainText) {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // iv.tag.ciphertext (base64)
  const packed = Buffer.concat([iv, tag, ciphertext]).toString('base64');
  return packed;
}

export function decryptText(packed) {
  const raw = Buffer.from(packed, 'base64');
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return plain;
}
