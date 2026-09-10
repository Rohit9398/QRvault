'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { QrCode, AlertCircle, Globe, ShieldX } from 'lucide-react';
import { Suspense } from 'react';

const errorConfig: Record<string, { icon: React.ElementType; title: string; message: string; color: string }> = {
  'not-found': {
    icon: QrCode,
    title: 'QR Code Not Found',
    message: 'This QR code does not exist in our system. Please check the URL and try again.',
    color: '#ef4444',
  },
  inactive: {
    icon: AlertCircle,
    title: 'QR Code Not Activated',
    message: 'This QR code has not been activated yet. Please use your activation code to activate it.',
    color: '#f59e0b',
  },
  disabled: {
    icon: ShieldX,
    title: 'QR Code Disabled',
    message: 'This QR code has been disabled by its owner.',
    color: '#ef4444',
  },
  'no-destination': {
    icon: Globe,
    title: 'No Destination Configured',
    message: 'This QR code does not have a destination configured yet.',
    color: '#6366f1',
  },
  error: {
    icon: AlertCircle,
    title: 'Something Went Wrong',
    message: 'An error occurred while processing this QR code. Please try again later.',
    color: '#ef4444',
  },
};

function QRErrorContent() {
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type') || searchParams.get('reason') || 'error';
  const normalizedType = rawType.replace('_', '-');
  const qrId = searchParams.get('id') || searchParams.get('qrId') || '';
  const config = errorConfig[normalizedType] || errorConfig[rawType] || errorConfig.error;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: `${config.color}15`,
            border: `1px solid ${config.color}30`,
          }}
        >
          <Icon className="w-8 h-8" style={{ color: config.color }} />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">{config.title}</h1>
        <p className="text-sm text-gray-400 mb-2 leading-relaxed">{config.message}</p>
        {qrId && (
          <p className="text-xs text-gray-600 font-mono mb-6">ID: {qrId}</p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {normalizedType === 'inactive' && (
            <Link
              href="/activate"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
            >
              Activate QR Code
            </Link>
          )}
          <Link
            href="/"
            className="px-6 py-2.5 text-sm font-medium text-gray-300 bg-gray-900/50 border border-gray-800/50 rounded-xl hover:bg-gray-800/50 transition-colors"
          >
            Go to QRVault
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function QRErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <QRErrorContent />
    </Suspense>
  );
}
