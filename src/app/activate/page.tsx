'use client';

import { useState } from 'react';
import { getQRCodeByActivationCode, activateQRCode, updateDestinationUrl, QRCodeRecord } from '@/lib/firestore';
import { isValidURL } from '@/lib/qr-utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  QrCode, Shield, CheckCircle2, AlertCircle, Globe,
  ArrowRight, Loader2, Save, Sparkles,
} from 'lucide-react';

type Step = 'enter-code' | 'activated' | 'set-destination' | 'complete';

export default function ActivatePage() {
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('enter-code');
  const [qr, setQr] = useState<QRCodeRecord | null>(null);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = activationCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter an activation code');
      return;
    }

    setLoading(true);
    try {
      const qrRecord = await getQRCodeByActivationCode(code);
      
      if (!qrRecord) {
        toast.error('Invalid activation code.');
        setLoading(false);
        return;
      }

      if (qrRecord.status === 'active') {
        toast.error('This QR code has already been activated.');
        setLoading(false);
        return;
      }

      await activateQRCode(qrRecord.id);
      setQr({ ...qrRecord, status: 'active' });
      setStep('activated');
      toast.success('QR Code Activated Successfully!');
    } catch (error) {
      console.error('Activation failed:', error);
      toast.error('Activation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDestination = async () => {
    if (!qr) return;
    if (!destinationUrl) {
      toast.error('Please enter a destination URL');
      return;
    }
    if (!isValidURL(destinationUrl)) {
      toast.error('Please enter a valid URL (http:// or https://)');
      return;
    }

    setSaving(true);
    try {
      await updateDestinationUrl(qr.id, destinationUrl);
      setStep('complete');
      toast.success('Destination saved successfully!');
    } catch {
      toast.error('Failed to save destination');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">QRVault</span>
          </Link>
        </div>

        {/* Step: Enter Code */}
        {step === 'enter-code' && (
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-violet-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Activate QR Code</h1>
              <p className="text-sm text-gray-400 mt-1">Enter your activation code to get started</p>
            </div>

            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Activation Code
                </label>
                <input
                  type="text"
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="ACT-729183"
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Activate QR
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Step: Activated */}
        {step === 'activated' && qr && (
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold text-white">QR Code Activated Successfully</h1>
              <p className="text-sm text-gray-400 mt-2">
                QR ID: <span className="font-mono text-violet-400">{qr.qrId}</span>
              </p>
            </div>

            <button
              onClick={() => setStep('set-destination')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
            >
              <Globe className="w-4 h-4" />
              Set Destination URL
            </button>
          </div>
        )}

        {/* Step: Set Destination */}
        {step === 'set-destination' && qr && (
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-7 h-7 text-blue-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Set Destination</h1>
              <p className="text-sm text-gray-400 mt-1">
                Where should <span className="font-mono text-violet-400">{qr.qrId}</span> redirect to?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Destination URL
                </label>
                <input
                  type="url"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/..."
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                />
              </div>

              <div className="p-3 rounded-xl bg-gray-800/20 text-xs text-gray-500">
                Supports websites, Google Maps, Google Reviews, social media, PDFs, and any valid HTTPS URL.
              </div>

              <button
                onClick={handleSaveDestination}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Destination
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && qr && (
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-8 animate-fadeIn text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">All Set!</h1>
            <p className="text-sm text-gray-400 mb-6">
              Your QR code <span className="font-mono text-violet-400">{qr.qrId}</span> is now active 
              and will redirect to your destination.
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setStep('enter-code');
                  setActivationCode('');
                  setQr(null);
                  setDestinationUrl('');
                }}
                className="w-full py-3 px-4 rounded-xl text-sm font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 transition-colors"
              >
                Activate Another QR Code
              </button>
              <Link
                href="/login"
                className="w-full py-3 px-4 rounded-xl text-sm font-medium text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 transition-colors inline-block text-center"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
