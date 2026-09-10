'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getQRCodeById, updateDestinationUrl, activateQRCode, deactivateQRCode, QRCodeRecord } from '@/lib/firestore';
import { generateQRDataURL, isValidURL, getEffectiveRedirectURL } from '@/lib/qr-utils';
import { downloadQRAsPNG, downloadQRAsSVG, printQRCodes } from '@/lib/download-utils';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft, Download, Printer, Edit3, Power, PowerOff,
  Globe, Calendar, Hash, Scan, Shield, ExternalLink, Save,
  X, Loader2, Copy,
} from 'lucide-react';

export default function QRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [qr, setQr] = useState<QRCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQR = async () => {
      try {
        const record = await getQRCodeById(id);
        if (record && record.ownerId === user?.uid) {
          const effectiveUrl = getEffectiveRedirectURL(record.redirectUrl, record.qrId);
          const updatedRecord = { ...record, redirectUrl: effectiveUrl };
          setQr(updatedRecord);
          setDestinationUrl(record.destinationUrl);
          const imageUrl = await generateQRDataURL(effectiveUrl, 400);
          setQrImageUrl(imageUrl);
        }
      } catch (error) {
        console.error('Failed to fetch QR:', error);
        toast.error('Failed to load QR code');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchQR();
  }, [id, user]);

  const handleSaveDestination = async () => {
    if (!qr) return;
    if (destinationUrl && !isValidURL(destinationUrl)) {
      toast.error('Please enter a valid URL (http:// or https://)');
      return;
    }

    setSaving(true);
    try {
      await updateDestinationUrl(qr.id, destinationUrl);
      setQr({ ...qr, destinationUrl });
      setEditing(false);
      toast.success('Destination updated successfully');
    } catch {
      toast.error('Failed to update destination');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!qr) return;
    try {
      if (qr.status === 'active') {
        await deactivateQRCode(qr.id);
        setQr({ ...qr, status: 'disabled' });
        toast.success('QR code deactivated');
      } else {
        await activateQRCode(qr.id);
        setQr({ ...qr, status: 'active' });
        toast.success('QR code activated');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDownloadPNG = async () => {
    if (!qr) return;
    await downloadQRAsPNG(qr.redirectUrl, qr.qrId);
    toast.success('PNG downloaded');
  };

  const handleDownloadSVG = async () => {
    if (!qr) return;
    await downloadQRAsSVG(qr.redirectUrl, qr.qrId);
    toast.success('SVG downloaded');
  };

  const handlePrint = () => {
    if (!qr || !qrImageUrl) return;
    printQRCodes(`
      <div style="text-align: center; padding: 40px;">
        <h2 style="font-size: 24px; margin-bottom: 8px; color: #333;">${qr.qrId}</h2>
        <img src="${qrImageUrl}" alt="QR Code" style="width: 300px; height: 300px;" />
        <p style="margin-top: 12px; font-size: 14px; color: #666;">Scan to visit</p>
      </div>
    `);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const formatDate = (timestamp: { toDate: () => Date } | null) => {
    if (!timestamp) return '—';
    return timestamp.toDate().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (!qr) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 font-medium mb-4">QR code not found</p>
        <Link href="/dashboard/qrs" className="text-violet-400 hover:text-violet-300 text-sm">
          Back to QR Codes
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/qrs"
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">QR Details</h1>
          <p className="text-sm text-gray-400 mt-0.5 font-mono">{qr.qrId}</p>
        </div>
        <StatusBadge status={qr.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* QR Image */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6 text-center">
            {qrImageUrl && (
              <div className="bg-white rounded-xl p-4 inline-block mb-4">
                <img src={qrImageUrl} alt={`QR Code ${qr.qrId}`} className="w-48 h-48 sm:w-56 sm:h-56" />
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="font-mono text-xs text-gray-400 truncate max-w-[200px]">{qr.redirectUrl}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(qr.redirectUrl);
                  toast.success('Redirect URL copied to clipboard');
                }}
                className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
                title="Copy URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <a
                href={qr.redirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 transition-all w-full"
              >
                <ExternalLink className="w-4 h-4" /> Test / Open Scan URL
              </a>
              <button
                onClick={handleDownloadPNG}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 transition-colors w-full"
              >
                <Download className="w-4 h-4" /> Download PNG
              </button>
              <button
                onClick={handleDownloadSVG}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 transition-colors w-full"
              >
                <Download className="w-4 h-4" /> Download SVG
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 transition-colors w-full"
              >
                <Printer className="w-4 h-4" /> Print QR
              </button>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Grid */}
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/20">
                <Hash className="w-5 h-5 text-violet-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">QR ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-gray-200">{qr.qrId}</p>
                    <button onClick={() => handleCopy(qr.qrId, 'QR ID')} className="text-gray-500 hover:text-gray-300">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/20">
                <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">Activation Code</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-gray-200">{qr.activationCode}</p>
                    <button onClick={() => handleCopy(qr.activationCode, 'Activation code')} className="text-gray-500 hover:text-gray-300">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/20">
                <Scan className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total Scans</p>
                  <p className="text-sm font-semibold text-gray-200">{qr.scanCount}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/20">
                <Calendar className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Created</p>
                  <p className="text-sm text-gray-200">{formatDate(qr.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-800/20 sm:col-span-2">
                <Calendar className="w-5 h-5 text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Activated</p>
                  <p className="text-sm text-gray-200">{formatDate(qr.activatedAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Destination URL</h2>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://www.example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveDestination}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Destination
                  </button>
                  <button
                    onClick={() => { setEditing(false); setDestinationUrl(qr.destinationUrl); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-800/20">
                <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                {qr.destinationUrl ? (
                  <a
                    href={qr.destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-violet-400 hover:text-violet-300 truncate flex items-center gap-1"
                  >
                    {qr.destinationUrl}
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-sm text-gray-500 italic">No destination configured</span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                qr.status === 'active'
                  ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
              }`}
            >
              {qr.status === 'active' ? (
                <><PowerOff className="w-4 h-4" /> Deactivate QR Code</>
              ) : (
                <><Power className="w-4 h-4" /> Activate QR Code</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
