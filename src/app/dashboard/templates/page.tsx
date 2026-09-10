'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserQRCodes, QRCodeRecord } from '@/lib/firestore';
import { generateQRDataURL } from '@/lib/qr-utils';
import { printQRCodes } from '@/lib/download-utils';
import toast from 'react-hot-toast';
import {
  Palette, Star, QrCode, Building2, Printer, Check, Loader2,
  FileText, CreditCard, Maximize,
} from 'lucide-react';

type TemplateType = 'google-review' | 'simple' | 'business';
type PrintSize = 'a4' | 'a5' | 'business-card';

interface TemplateConfig {
  id: TemplateType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const templates: TemplateConfig[] = [
  {
    id: 'google-review',
    name: 'Google Review',
    description: 'Perfect for restaurants, shops, and service businesses wanting Google reviews.',
    icon: Star,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'simple',
    name: 'Simple QR',
    description: 'Clean, minimal design that works for any purpose.',
    icon: QrCode,
    color: 'from-violet-500 to-indigo-500',
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Professional template with your business name and branding.',
    icon: Building2,
    color: 'from-emerald-500 to-teal-500',
  },
];

const printSizes: { id: PrintSize; name: string; icon: React.ElementType; desc: string }[] = [
  { id: 'a4', name: 'A4', icon: FileText, desc: '210 × 297mm' },
  { id: 'a5', name: 'A5', icon: Maximize, desc: '148 × 210mm' },
  { id: 'business-card', name: 'Business Card', icon: CreditCard, desc: '85 × 55mm' },
];

function generateTemplateHTML(
  template: TemplateType,
  qrImageUrl: string,
  qrId: string,
  businessName: string = 'Your Business'
): string {
  switch (template) {
    case 'google-review':
      return `
        <div style="text-align:center; padding:40px; border:2px solid #e5e7eb; border-radius:16px; max-width:350px; margin:0 auto; page-break-inside:avoid;">
          <div style="font-size:36px; margin-bottom:8px;">★★★★★</div>
          <h2 style="font-size:20px; color:#1f2937; margin-bottom:4px; font-weight:700;">Loved your experience?</h2>
          <p style="font-size:14px; color:#6b7280; margin-bottom:20px;">Scan to leave us a Google Review</p>
          <img src="${qrImageUrl}" alt="QR Code" style="width:200px; height:200px; display:block; margin:0 auto 16px;" />
          <p style="font-family:monospace; font-size:12px; color:#9ca3af; margin-bottom:8px;">${qrId}</p>
          <p style="font-size:13px; color:#6b7280;">Your feedback means a lot to us!</p>
        </div>
      `;
    case 'simple':
      return `
        <div style="text-align:center; padding:40px; border:2px solid #e5e7eb; border-radius:16px; max-width:300px; margin:0 auto; page-break-inside:avoid;">
          <h2 style="font-size:22px; color:#1f2937; margin-bottom:20px; font-weight:700; letter-spacing:4px;">SCAN ME</h2>
          <img src="${qrImageUrl}" alt="QR Code" style="width:200px; height:200px; display:block; margin:0 auto 16px;" />
          <p style="font-family:monospace; font-size:12px; color:#9ca3af; margin-bottom:8px;">${qrId}</p>
          <p style="font-size:13px; color:#6b7280;">Scan to visit</p>
        </div>
      `;
    case 'business':
      return `
        <div style="text-align:center; padding:40px; border:2px solid #e5e7eb; border-radius:16px; max-width:350px; margin:0 auto; page-break-inside:avoid;">
          <h2 style="font-size:18px; color:#1f2937; margin-bottom:4px; font-weight:700; text-transform:uppercase; letter-spacing:2px;">${businessName}</h2>
          <p style="font-size:15px; color:#4b5563; margin-bottom:20px; font-weight:600;">SCAN TO REVIEW US</p>
          <img src="${qrImageUrl}" alt="QR Code" style="width:200px; height:200px; display:block; margin:0 auto 16px;" />
          <p style="font-family:monospace; font-size:12px; color:#9ca3af; margin-bottom:8px;">${qrId}</p>
          <p style="font-size:13px; color:#6b7280;">Thank you for your feedback!</p>
        </div>
      `;
  }
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('google-review');
  const [selectedSize, setSelectedSize] = useState<PrintSize>('a4');
  const [businessName, setBusinessName] = useState('Your Business');
  const [printing, setPrinting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [qrCodes, setQrCodes] = useState<QRCodeRecord[]>([]);
  const [selectedQRs, setSelectedQRs] = useState<Set<string>>(new Set());
  const [loadingQRs, setLoadingQRs] = useState(false);

  const loadQRCodes = async () => {
    if (!user) return;
    setLoadingQRs(true);
    try {
      const { records } = await getUserQRCodes(user.uid, undefined, undefined, 200);
      setQrCodes(records);
      setSelectMode(true);
    } catch {
      toast.error('Failed to load QR codes');
    } finally {
      setLoadingQRs(false);
    }
  };

  const handlePrint = async () => {
    if (selectedQRs.size === 0) {
      toast.error('Please select QR codes to print');
      return;
    }

    setPrinting(true);
    try {
      const selected = qrCodes.filter(q => selectedQRs.has(q.id));
      const htmlParts: string[] = [];

      for (const qr of selected) {
        const imageUrl = await generateQRDataURL(qr.redirectUrl, 400);
        htmlParts.push(generateTemplateHTML(selectedTemplate, imageUrl, qr.qrId, businessName));
      }

      const gridCols = selectedSize === 'business-card' ? 3 : selectedSize === 'a5' ? 2 : 1;
      const html = `
        <div style="display:grid; grid-template-columns:repeat(${gridCols}, 1fr); gap:20px; padding:20px;">
          ${htmlParts.join('')}
        </div>
      `;

      printQRCodes(html);
      toast.success('Print dialog opened');
    } catch {
      toast.error('Failed to generate print layout');
    } finally {
      setPrinting(false);
    }
  };

  const toggleQR = (id: string) => {
    setSelectedQRs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Print Templates</h1>
        <p className="text-sm text-gray-400 mt-1">Choose a template and print your QR codes</p>
      </div>

      {/* Template Selection */}
      <div className="grid sm:grid-cols-3 gap-4">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(t.id)}
            className={`relative p-5 rounded-2xl border text-left transition-all duration-200 ${
              selectedTemplate === t.id
                ? 'border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-500/10'
                : 'border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50'
            }`}
          >
            {selectedTemplate === t.id && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mb-3`}>
              <t.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{t.name}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Print Settings */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold text-white">Print Settings</h2>

        {/* Business Name (for business template) */}
        {selectedTemplate === 'business' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Business Name"
              className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
          </div>
        )}

        {/* Print Size */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Print Size</label>
          <div className="grid grid-cols-3 gap-3">
            {printSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedSize(size.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  selectedSize === size.id
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-gray-800/50 bg-gray-900/50 text-gray-400 hover:bg-gray-800/30'
                }`}
              >
                <size.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{size.name}</span>
                <span className="text-xs text-gray-500">{size.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* QR Selection */}
      {!selectMode ? (
        <button
          onClick={loadQRCodes}
          disabled={loadingQRs}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50"
        >
          {loadingQRs ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Palette className="w-5 h-5" />
              Select QR Codes to Print
            </>
          )}
        </button>
      ) : (
        <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
            <h2 className="text-lg font-semibold text-white">
              Select QR Codes <span className="text-sm text-gray-500 font-normal">({selectedQRs.size} selected)</span>
            </h2>
          </div>

          {qrCodes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <QrCode className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No QR codes found. Generate some first!</p>
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-800/30">
                {qrCodes.map((qr) => (
                  <label
                    key={qr.id}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-gray-800/20 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedQRs.has(qr.id)}
                      onChange={() => toggleQR(qr.id)}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-violet-500 focus:ring-violet-500/50"
                    />
                    <span className="font-mono text-sm text-gray-200">{qr.qrId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      qr.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {qr.status}
                    </span>
                  </label>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-gray-800/50">
                <button
                  onClick={handlePrint}
                  disabled={printing || selectedQRs.size === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {printing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Printer className="w-5 h-5" />
                      Print {selectedQRs.size} QR Code{selectedQRs.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Template Previews */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Template Preview</h2>
        <div className="bg-white rounded-xl p-8">
          {selectedTemplate === 'google-review' && (
            <div style={{ textAlign: 'center', maxWidth: 300, margin: '0 auto' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>★★★★★</div>
              <h3 style={{ fontSize: 18, color: '#1f2937', fontWeight: 700 }}>Loved your experience?</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Scan to leave us a Google Review</p>
              <div style={{ width: 160, height: 160, background: '#f3f4f6', borderRadius: 12, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>[ QR CODE ]</span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Your feedback means a lot to us!</p>
            </div>
          )}
          {selectedTemplate === 'simple' && (
            <div style={{ textAlign: 'center', maxWidth: 250, margin: '0 auto' }}>
              <h3 style={{ fontSize: 20, color: '#1f2937', fontWeight: 700, letterSpacing: 4 }}>SCAN ME</h3>
              <div style={{ width: 160, height: 160, background: '#f3f4f6', borderRadius: 12, margin: '16px auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>[ QR CODE ]</span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Scan to visit</p>
            </div>
          )}
          {selectedTemplate === 'business' && (
            <div style={{ textAlign: 'center', maxWidth: 300, margin: '0 auto' }}>
              <h3 style={{ fontSize: 16, color: '#1f2937', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 2 }}>{businessName}</h3>
              <p style={{ fontSize: 14, color: '#4b5563', fontWeight: 600, marginBottom: 16 }}>SCAN TO REVIEW US</p>
              <div style={{ width: 160, height: 160, background: '#f3f4f6', borderRadius: 12, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>[ QR CODE ]</span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280' }}>Thank you for your feedback!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
