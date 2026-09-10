/**
 * Cryptographically secure ID generation for QR IDs and Activation Codes.
 * Uses crypto.getRandomValues() for secure randomness.
 */

const QR_ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous: 0, O, I, 1
const ACT_CODE_CHARS = '0123456789';

/**
 * Generate a cryptographically secure random string
 */
function secureRandom(length: number, chars: string): string {
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (val) => chars[val % chars.length]).join('');
}

/**
 * Generate a unique QR ID in format: QR-XXXXXX
 */
export function generateQRId(): string {
  const id = secureRandom(6, QR_ID_CHARS);
  return `QR-${id}`;
}

/**
 * Generate a unique Activation Code in format: ACT-XXXXXX
 */
export function generateActivationCode(): string {
  const code = secureRandom(6, ACT_CODE_CHARS);
  return `ACT-${code}`;
}

/**
 * Generate multiple unique QR IDs
 */
export function generateUniqueQRIds(count: number): string[] {
  const ids = new Set<string>();
  while (ids.size < count) {
    ids.add(generateQRId());
  }
  return Array.from(ids);
}

/**
 * Generate multiple unique Activation Codes
 */
export function generateUniqueActivationCodes(count: number): string[] {
  const codes = new Set<string>();
  while (codes.size < count) {
    codes.add(generateActivationCode());
  }
  return Array.from(codes);
}
