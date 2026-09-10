import QRCode from 'qrcode';

/**
 * Generate QR code as Data URL (PNG)
 */
export async function generateQRDataURL(url: string, size: number = 300): Promise<string> {
  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRSVG(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Build the redirect URL for a QR code
 */
export function buildRedirectURL(qrId: string): string {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if ((!baseUrl || baseUrl.includes('localhost')) && typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  }
  if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
  }
  return `${baseUrl.replace(/\/$/, '')}/r/${qrId}`;
}

/**
 * Resolve effective redirect URL so older QRs created on localhost
 * automatically point to the current active deployed domain when viewed or downloaded.
 */
export function getEffectiveRedirectURL(savedUrl: string, qrId: string): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && (!savedUrl || savedUrl.includes('localhost'))) {
      return `${origin.replace(/\/$/, '')}/r/${qrId}`;
    }
  }
  return savedUrl || buildRedirectURL(qrId);
}

/**
 * Validate a URL string
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
