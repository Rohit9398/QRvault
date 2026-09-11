'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getQRCodeById, updateDestinationUrl, activateQRCode, deactivateQRCode, QRCodeRecord } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { generateQRDataURL, isValidURL, getEffectiveRedirectURL } from '@/lib/qr-utils';
import { downloadQRAsPNG, downloadQRAsSVG, printQRCodes } from '@/lib/download-utils';
import StatusBadge from '@/components/StatusBadge';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeft, Download, Printer, Edit3, Power, PowerOff,
  Globe, Calendar, Hash, Scan, Shield, ExternalLink, Save,
  X, Loader2, Copy, RotateCw,
} from 'lucide-react';

export default function QRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [qr, setQr] = useState<QRCodeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const applyQRData = useCallback(async (record: QRCodeRecord) => {
    const effectiveUrl = getEffectiveRedirectURL(record.redirectUrl, record.qrId);
    const updatedRecord = { ...record, redirectUrl: effectiveUrl };
    setQr(updatedRecord);
    setDestinationUrl((prev) => (editing ? prev : record.destinationUrl || ''));
    try {
      const imageUrl = await generateQRDataURL(effectiveUrl, 400);
      setQrImageUrl(imageUrl);
    } catch (e) {
      console.error('Failed to generate QR image:', e);
    }
  }, [editing]);

  useEffect(() => {
    if (!user || !id) return;

    // Real-time listener for instant scan count updates
    const docRef = doc(db, 'qrCodes', id);
    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.ownerId === user.uid) {
            const record = { id: docSnap.id, ...data } as QRCodeRecord;
            await applyQRData(record);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Realtime QR listener error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, user, applyQRData]);

  const handleManualRefresh = async () => {
    if (!user || !id) return;
    setRefreshing(true);
    try {
      const record = await getQRCodeById(id);
      if (record && record.ownerId === user.uid) {
        await applyQRData(record);
        toast.success('Refreshed!');
      }
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

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

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPrintTemplate, setSelectedPrintTemplate] = useState<'google-review-square' | 'google-review-vertical' | 'simple'>('google-review-square');

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
    setPrintModalOpen(true);
  };

  const executePrint = () => {
    if (!qr || !qrImageUrl) return;
    const actCode = qr.activationCode || qr.qrId;

    let templateHTML = '';
    if (selectedPrintTemplate === 'google-review-square') {
      templateHTML = `
        <div style="width:340px; height:340px; border-radius:28px; background:#ffffff; box-shadow:0 10px 28px rgba(0,0,0,0.1); border:1px solid #e2e8f0; overflow:hidden; font-family:'Inter',system-ui,-apple-system,sans-serif; display:flex; flex-direction:column; position:relative; page-break-inside:avoid; margin:20px auto; box-sizing:border-box;">
          <div style="background:#1a73e8; color:#ffffff; padding:22px 16px 36px; text-align:center; position:relative;">
            <h2 style="font-size:15px; font-weight:800; letter-spacing:0.8px; margin:0 0 6px; text-transform:uppercase; color:#ffffff; line-height:1.25;">
              MAKE OUR DAY,<br>LEAVE US A REVIEW!
            </h2>
            <div style="font-size:18px; color:#fbbc04; letter-spacing:3px;">★★★★★</div>
            <svg viewBox="0 0 500 60" preserveAspectRatio="none" style="position:absolute; bottom:0; left:0; width:100%; height:28px;">
              <path d="M0,20 C150,60 350,0 500,40 L500,60 L0,60 Z" fill="#ffffff"></path>
            </svg>
          </div>
          <div style="position:absolute; top:112px; left:50%; transform:translateX(-50%); width:66px; height:66px; background:#ffffff; border-radius:50%; box-shadow:0 4px 14px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center; z-index:10;">
            <svg viewBox="0 0 24 24" width="44" height="44">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
          <div style="flex:1; padding:36px 20px 14px; display:flex; align-items:center; justify-content:space-around; background:#ffffff;">
            <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
              <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="18" y="10" width="22" height="38" rx="4" fill="#ffffff"/>
                <line x1="25" y1="15" x2="33" y2="15"/>
                <path d="M44 24c2.5 1.8 4 4.3 4 7s-1.5 5.2-4 7"/>
                <path d="M48 20c4.5 3 7 7 7 11s-2.5 8-7 11"/>
                <path d="M10 44c4-2 7-6 11-10l5 3-4 6c-2 3-5 5-8 6z"/>
              </svg>
              <span style="font-size:12px; font-weight:800; color:#111827; margin-top:5px; letter-spacing:0.5px; line-height:1.2;">
                TAP<br>OR<br>SCAN
              </span>
            </div>
            <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
              <div style="padding:6px; border:2px solid #111827; border-radius:12px; background:#ffffff;">
                <img src="${qrImageUrl}" alt="QR Code" style="width:112px; height:112px; display:block;" />
              </div>
              <span style="font-size:10px; font-weight:700; color:#4b5563; margin-top:5px; font-family:monospace; letter-spacing:0.5px;">
                Act: ${actCode}
              </span>
            </div>
          </div>
        </div>
      `;
    } else if (selectedPrintTemplate === 'google-review-vertical') {
      templateHTML = `
        <div style="width:280px; height:440px; border-radius:28px; background:#ffffff; box-shadow:0 10px 28px rgba(0,0,0,0.1); border:1px solid #e2e8f0; overflow:hidden; font-family:'Inter',system-ui,-apple-system,sans-serif; display:flex; flex-direction:column; position:relative; page-break-inside:avoid; margin:20px auto; box-sizing:border-box;">
          <div style="background:#1a73e8; color:#ffffff; padding:26px 16px 48px; text-align:center; position:relative;">
            <h2 style="font-size:18px; font-weight:800; letter-spacing:0.5px; margin:0; color:#ffffff;">
              Review us on Google
            </h2>
            <svg viewBox="0 0 500 80" preserveAspectRatio="none" style="position:absolute; bottom:0; left:0; width:100%; height:32px;">
              <path d="M0,30 C180,80 320,0 500,45 L500,80 L0,80 Z" fill="#ffffff"></path>
            </svg>
          </div>
          <div style="position:absolute; top:72px; left:50%; transform:translateX(-50%); width:84px; height:84px; background:#ffffff; border-radius:50%; box-shadow:0 6px 18px rgba(0,0,0,0.14); display:flex; align-items:center; justify-content:center; z-index:10;">
            <svg viewBox="0 0 24 24" width="56" height="56">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
          <div style="text-align:center; margin-top:44px; font-size:24px; color:#fbbc04; letter-spacing:4px;">
            ★★★★★
          </div>
          <div style="flex:1; padding:18px 20px 20px; display:flex; align-items:center; justify-content:space-around; background:#ffffff;">
            <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
              <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="18" y="10" width="22" height="38" rx="4" fill="#ffffff"/>
                <line x1="25" y1="15" x2="33" y2="15"/>
                <path d="M44 24c2.5 1.8 4 4.3 4 7s-1.5 5.2-4 7"/>
                <path d="M48 20c4.5 3 7 7 7 11s-2.5 8-7 11"/>
                <path d="M10 44c4-2 7-6 11-10l5 3-4 6c-2 3-5 5-8 6z"/>
              </svg>
              <span style="font-size:13px; font-weight:800; color:#111827; margin-top:5px; letter-spacing:0.3px;">
                Tap or Scan
              </span>
            </div>
            <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
              <div style="padding:6px; border:2px solid #111827; border-radius:12px; background:#ffffff;">
                <img src="${qrImageUrl}" alt="QR Code" style="width:115px; height:115px; display:block;" />
              </div>
              <span style="font-size:10px; font-weight:700; color:#4b5563; margin-top:5px; font-family:monospace; letter-spacing:0.5px;">
                Act: ${actCode}
              </span>
            </div>
          </div>
        </div>
      `;
    } else {
      templateHTML = `
        <div style="text-align:center; padding:36px; border:2px solid #e5e7eb; border-radius:20px; max-width:300px; margin:20px auto; background:#ffffff; page-break-inside:avoid; font-family:'Inter',system-ui,sans-serif;">
          <h2 style="font-size:22px; color:#111827; margin:0 0 16px; font-weight:800; letter-spacing:3px;">SCAN ME</h2>
          <div style="display:inline-block; padding:8px; border:2px solid #111827; border-radius:12px; background:#ffffff; margin-bottom:12px;">
            <img src="${qrImageUrl}" alt="QR Code" style="width:180px; height:180px; display:block;" />
          </div>
          <p style="font-family:monospace; font-size:11px; font-weight:700; color:#4b5563; margin:0 0 4px; letter-spacing:0.5px;">Act Code: ${actCode}</p>
          <p style="font-size:12px; color:#6b7280; margin:0;">Scan to visit</p>
        </div>
      `;
    }

    printQRCodes(templateHTML);
    setPrintModalOpen(false);
    toast.success('Print layout generated');
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
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 mb-0.5">Total Scans</p>
                    <button
                      onClick={handleManualRefresh}
                      disabled={refreshing}
                      title="Refresh scan count"
                      className="text-gray-500 hover:text-gray-300 transition-colors p-0.5 rounded cursor-pointer"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-violet-400' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-200">{qr.scanCount || 0}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
                    </span>
                  </div>
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

      {/* Print Template Selection Modal */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Choose Print Template</h3>
                <p className="text-xs text-gray-400 mt-0.5">Select a design to print with this QR code & activation code.</p>
              </div>
              <button
                onClick={() => setPrintModalOpen(false)}
                className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelectedPrintTemplate('google-review-square')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedPrintTemplate === 'google-review-square'
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500 text-white'
                    : 'border-gray-800 bg-gray-950/50 text-gray-300 hover:bg-gray-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Google Review Standee (Square)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium">Recommended</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Official Google wave header, 5 gold stars, Tap or Scan icon + Act Code: <code className="font-mono text-gray-300">{qr.activationCode}</code>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPrintTemplate('google-review-vertical')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedPrintTemplate === 'google-review-vertical'
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500 text-white'
                    : 'border-gray-800 bg-gray-950/50 text-gray-300 hover:bg-gray-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Google Review Card (Vertical Standee)</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Vertical tent layout with Google &quot;G&quot; logo, 5 stars, NFC tap icon + Act Code: <code className="font-mono text-gray-300">{qr.activationCode}</code>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPrintTemplate('simple')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedPrintTemplate === 'simple'
                    ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500 text-white'
                    : 'border-gray-800 bg-gray-950/50 text-gray-300 hover:bg-gray-800/40'
                }`}
              >
                <span className="font-semibold text-sm">Minimalist &quot;SCAN ME&quot; Card</span>
                <p className="text-xs text-gray-400 mt-1">
                  Clean modern card with large QR code + Act Code: <code className="font-mono text-gray-300">{qr.activationCode}</code>
                </p>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-gray-300 bg-gray-800/60 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executePrint}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all"
              >
                <Printer className="w-4 h-4" />
                Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
