import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRIMARY_DOMAIN = 'dynamicqr-six.vercel.app';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Ignore local development
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return NextResponse.next();
  }

  // If visiting via any git preview or deployment URL, redirect to clean primary domain
  if (host.includes('vercel.app') && host !== PRIMARY_DOMAIN) {
    const targetUrl = new URL(request.nextUrl.pathname + request.nextUrl.search, `https://${PRIMARY_DOMAIN}`);
    return NextResponse.redirect(targetUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files, favicon, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
