const crypto = require('crypto');

/**
 * AES-256-GCM encryption utility
 *
 * Encrypted format stored in DB:
 *   "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * Why AES-256-GCM:
 *   - Authenticated encryption — detects tampering (authTag)
 *   - Random IV per encryption — same plaintext → different ciphertext
 *   - Industry standard for field-level encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;   // 128-bit IV
const TAG_LENGTH = 16;  // 128-bit auth tag

/**
 * Get the 32-byte key buffer from env
 */
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY is not set in environment variables');
  // Derive a consistent 32-byte key using SHA-256
  return crypto.createHash('sha256').update(key).digest();
};

/**
 * Encrypt a string value
 * @param {string} plaintext
 * @returns {string}  "<iv>:<tag>:<ciphertext>" or null if input is null/undefined
 */
const encrypt = (plaintext) => {
  if (plaintext === null || plaintext === undefined) return plaintext;
  const text = String(plaintext);

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

/**
 * Decrypt an encrypted string
 * @param {string} encryptedValue  "<iv>:<tag>:<ciphertext>"
 * @returns {string} plaintext or null if input is null/undefined
 */
const decrypt = (encryptedValue) => {
  if (!encryptedValue || typeof encryptedValue !== 'string') return encryptedValue;
  // If not in encrypted format, return as-is (handles legacy unencrypted data)
  if (!encryptedValue.includes(':')) return encryptedValue;

  try {
    const [ivHex, tagHex, ciphertextHex] = encryptedValue.split(':');
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8');
  } catch {
    // Return as-is if decryption fails (e.g. legacy plain data)
    return encryptedValue;
  }
};

/**
 * Check if a value is already encrypted (has our format)
 */
const isEncrypted = (value) => {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 3 && parts[0].length === 32; // IV is 16 bytes = 32 hex chars
};

module.exports = { encrypt, decrypt, isEncrypted };
