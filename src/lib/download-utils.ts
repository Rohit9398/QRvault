import JSZip from 'jszip';
import { generateQRDataURL, generateQRSVG } from './qr-utils';

/**
 * Download a single QR code as PNG
 */
export async function downloadQRAsPNG(url: string, filename: string): Promise<void> {
  const dataUrl = await generateQRDataURL(url, 512);
  const link = document.createElement('a');
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Download a single QR code as SVG
 */
export async function downloadQRAsSVG(url: string, filename: string): Promise<void> {
  const svgString = await generateQRSVG(url);
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.svg`;
  link.href = blobUrl;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

/**
 * Data URL to Blob conversion
 */
function dataURLtoBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(parts[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Download multiple QR codes as a ZIP file
 */
export async function downloadQRsAsZIP(
  qrCodes: { qrId: string; redirectUrl: string }[],
  format: 'png' | 'svg' = 'png',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('qr-codes');
  
  if (!folder) throw new Error('Failed to create ZIP folder');
  
  for (let i = 0; i < qrCodes.length; i++) {
    const { qrId, redirectUrl } = qrCodes[i];
    
    if (format === 'png') {
      const dataUrl = await generateQRDataURL(redirectUrl, 512);
      const blob = dataURLtoBlob(dataUrl);
      folder.file(`${qrId}.png`, blob);
    } else {
      const svgString = await generateQRSVG(redirectUrl);
      folder.file(`${qrId}.svg`, svgString);
    }
    
    onProgress?.(i + 1, qrCodes.length);
  }
  
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.download = `qr-codes-${Date.now()}.zip`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Print QR codes using the browser print dialog
 */
export function printQRCodes(htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print QR Codes</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; }
        @media print {
          .no-print { display: none !important; }
          @page { margin: 10mm; }
        }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
