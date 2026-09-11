import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrId: string }> }
) {
  const { qrId } = await params;
  // Lazy import to avoid Firebase initialization during build
  const { getQRCodeByQRId, incrementScanCount } = await import('@/lib/firestore');
  
  try {
    const qr = await getQRCodeByQRId(qrId);

    if (!qr) {
      return NextResponse.redirect(new URL(`/qr-error?type=not-found&id=${qrId}`, request.url));
    }

    if (qr.status === 'inactive') {
      return NextResponse.redirect(new URL(`/qr-error?type=inactive&id=${qrId}`, request.url));
    }

    if (qr.status === 'disabled') {
      return NextResponse.redirect(new URL(`/qr-error?type=disabled&id=${qrId}`, request.url));
    }

    if (!qr.destinationUrl) {
      return NextResponse.redirect(new URL(`/qr-error?type=no-destination&id=${qrId}`, request.url));
    }

    // Increment scan count and wait for completion before redirecting
    try {
      await incrementScanCount(qr.id);
    } catch (scanErr) {
      console.error('Failed to increment scan count:', scanErr);
    }

    // Redirect to destination with no-cache headers to ensure every scan is recorded
    const response = NextResponse.redirect(qr.destinationUrl, { status: 307 });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect(new URL(`/qr-error?type=error&id=${qrId}`, request.url));
  }
}

