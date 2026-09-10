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
