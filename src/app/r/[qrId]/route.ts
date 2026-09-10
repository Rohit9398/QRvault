import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    // Increment scan count (async, don't block redirect)
    incrementScanCount(qr.id).catch(console.error);

    // Redirect to destination
    return NextResponse.redirect(qr.destinationUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect(new URL(`/qr-error?type=error&id=${qrId}`, request.url));
  }
}
