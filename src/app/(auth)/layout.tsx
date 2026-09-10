'use client';

import AuthGuard from '@/components/AuthGuard';
import { QrCode } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gray-950 grid-bg flex">
        {/* Left decorative panel (desktop) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
          
          <div className="relative">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">QRVault</span>
            </Link>
          </div>

          <div className="relative">
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Dynamic QR codes
              <br />
              <span className="gradient-text">made simple.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-md">
              Generate, activate, and manage thousands of QR codes with ease. 
              Change destinations without reprinting.
            </p>
          </div>

          <div className="relative">
            <p className="text-sm text-gray-600">© 2026 QRVault</p>
          </div>
        </div>

        {/* Right content panel */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <QrCode className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">QRVault</span>
              </Link>
            </div>
            {children}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
