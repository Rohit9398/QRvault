import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Lazy import to avoid Firebase initialization during build
  const { getQRCodeByActivationCode, activateQRCode, updateDestinationUrl } = await import('@/lib/firestore');
  try {
    const body = await request.json();
    const { activationCode, destinationUrl } = body;

    if (!activationCode) {
      return NextResponse.json(
        { error: 'Activation code is required' },
        { status: 400 }
      );
    }

    const code = activationCode.trim().toUpperCase();
    const qr = await getQRCodeByActivationCode(code);

    if (!qr) {
      return NextResponse.json(
        { error: 'Invalid activation code.' },
        { status: 404 }
      );
    }

    if (qr.status === 'active') {
      return NextResponse.json(
        { error: 'This QR code has already been activated.' },
        { status: 409 }
      );
    }

    // Activate the QR code
    await activateQRCode(qr.id);

    // If destination URL provided, save it
    if (destinationUrl) {
      try {
        new URL(destinationUrl);
        await updateDestinationUrl(qr.id, destinationUrl);
      } catch {
        // Invalid URL - skip setting destination
      }
    }

    return NextResponse.json({
      success: true,
      qrId: qr.qrId,
      message: 'QR Code activated successfully',
    });
  } catch (error) {
    console.error('Activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
