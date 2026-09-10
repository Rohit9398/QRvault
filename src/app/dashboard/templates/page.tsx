'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserQRCodes, QRCodeRecord } from '@/lib/firestore';
import { generateQRDataURL, getEffectiveRedirectURL } from '@/lib/qr-utils';
import { printQRCodes } from '@/lib/download-utils';
import toast from 'react-hot-toast';
import {
  Palette, Star, QrCode, Building2, Printer, Check, Loader2,
  FileText, CreditCard, Maximize, LayoutTemplate, Smartphone
} from 'lucide-react';

export type TemplateType = 'google-review-square' | 'google-review-vertical' | 'simple' | 'business';
export type PrintSize = 'a4' | 'a5' | 'business-card';

interface TemplateConfig {
  id: TemplateType;
  name: string;
  badge: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const templates: TemplateConfig[] = [
  {
    id: 'google-review-square',
    name: 'Google Review (Square Standee)',
    badge: 'Popular',
    description: 'Blue curved header with "MAKE OUR DAY, LEAVE US A REVIEW!", Google logo, Tap or Scan NFC, and activation code.',
    icon: Star,
    color: 'from-blue-600 to-indigo-600',
  },
  {
    id: 'google-review-vertical',
    name: 'Google Review (Vertical Standee)',
    badge: 'Trending',
    description: 'Vertical card with "Review us on Google", big Google "G" badge, 5 gold stars, Tap or Scan, and activation code.',
    icon: Smartphone,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'simple',
    name: 'Minimalist QR Card',
    badge: 'Clean',
    description: 'Clean, high-contrast QR display with "SCAN ME" and small activation code.',
    icon: QrCode,
    color: 'from-violet-500 to-indigo-500',
  },
  {
    id: 'business',
    name: 'Custom Business Card',
    badge: 'Branded',
    description: 'Custom business name header, review callout, QR code, and small activation code.',
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
  activationCode: string = '',
  businessName: string = 'Your Business'
): string {
  const displayActCode = activationCode || qrId;

  switch (template) {
    case 'google-review-square':
      return `
        <div style="width:340px; height:340px; border-radius:28px; background:#ffffff; box-shadow:0 10px 28px rgba(0,0,0,0.1); border:1px solid #e2e8f0; overflow:hidden; font-family:'Inter',system-ui,-apple-system,sans-serif; display:flex; flex-direction:column; position:relative; page-break-inside:avoid; margin:12px auto; box-sizing:border-box;">
          <!-- Blue Top Header -->
          <div style="background:#1a73e8; color:#ffffff; padding:22px 16px 36px; text-align:center; position:relative;">
            <h2 style="font-size:15px; font-weight:800; letter-spacing:0.8px; margin:0 0 6px; text-transform:uppercase; color:#ffffff; line-height:1.25; font-family:'Inter',system-ui,sans-serif;">
              MAKE OUR DAY,<br>LEAVE US A REVIEW!
            </h2>
            <div style="font-size:18px; color:#fbbc04; letter-spacing:3px;">★★★★★</div>
            <svg viewBox="0 0 500 60" preserveAspectRatio="none" style="position:absolute; bottom:0; left:0; width:100%; height:28px;">
              <path d="M0,20 C150,60 350,0 500,40 L500,60 L0,60 Z" fill="#ffffff"></path>
            </svg>
          </div>
          
          <!-- Centered Google 'G' Circular Badge -->
          <div style="position:absolute; top:112px; left:50%; transform:translateX(-50%); width:66px; height:66px; background:#ffffff; border-radius:50%; box-shadow:0 4px 14px rgba(0,0,0,0.15); display:flex; align-items:center; justify-content:center; z-index:10;">
            <svg viewBox="0 0 24 24" width="44" height="44">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>

          <!-- Bottom: Tap / Scan + QR Code + Small Activation Code -->
          <div style="flex:1; padding:36px 20px 14px; display:flex; align-items:center; justify-content:space-around; background:#ffffff;">
            <!-- Left: Phone NFC Tap Icon -->
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
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

            <!-- Right: QR Code Box + Small Activation Code Underneath -->
            <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
              <div style="padding:6px; border:2px solid #111827; border-radius:12px; background:#ffffff;">
                <img src="${qrImageUrl}" alt="QR Code" style="width:112px; height:112px; display:block;" />
              </div>
              <span style="font-size:10px; font-weight:700; color:#4b5563; margin-top:5px; font-family:monospace; letter-spacing:0.5px;">
                Act: ${displayActCode}
              </span>
            </div>
          </div>
        </div>
      `;

    case 'google-review-vertical':
      return `
        <div style="width:280px; height:440px; border-radius:28px; background:#ffffff; box-shadow:0 10px 28px rgba(0,0,0,0.1); border:1px solid #e2e8f0; overflow:hidden; font-family:'Inter',system-ui,-apple-system,sans-serif; display:flex; flex-direction:column; position:relative; page-break-inside:avoid; margin:12px auto; box-sizing:border-box;">
          <!-- Blue Top Header -->
          <div style="background:#1a73e8; color:#ffffff; padding:26px 16px 48px; text-align:center; position:relative;">
            <h2 style="font-size:18px; font-weight:800; letter-spacing:0.5px; margin:0; color:#ffffff; font-family:'Inter',system-ui,sans-serif;">
              Review us on Google
            </h2>
            <svg viewBox="0 0 500 80" preserveAspectRatio="none" style="position:absolute; bottom:0; left:0; width:100%; height:32px;">
              <path d="M0,30 C180,80 320,0 500,45 L500,80 L0,80 Z" fill="#ffffff"></path>
            </svg>
          </div>

          <!-- Big Centered Google 'G' -->
          <div style="position:absolute; top:72px; left:50%; transform:translateX(-50%); width:84px; height:84px; background:#ffffff; border-radius:50%; box-shadow:0 6px 18px rgba(0,0,0,0.14); display:flex; align-items:center; justify-content:center; z-index:10;">
            <svg viewBox="0 0 24 24" width="56" height="56">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>

          <!-- 5 Gold Stars below 'G' -->
          <div style="text-align:center; margin-top:44px; font-size:24px; color:#fbbc04; letter-spacing:4px;">
            ★★★★★
          </div>

          <!-- Bottom: Tap or Scan + QR with activation code -->
          <div style="flex:1; padding:18px 20px 20px; display:flex; align-items:center; justify-content:space-around; background:#ffffff;">
            <!-- Tap phone icon -->
            <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
              <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="#111827" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="18" y="10" width="22" height="38" rx="4" fill="#ffffff"/>
                <line x1="25" y1="15" x2="33" y2="15"/>
                <path d="M44 24c2.5 1.8 4 4.3 4 7s-1.5 5.2-4 7"/>
                <path d="M48 20c4.5 3 7 7 7 11s-2.5 8-7 11"/>
                <path d="M10 44c4-2 7-6 11-10l5 3-4 6c-2 3-5 5-8 6z"/>
              </svg>
              <span style="font-size:13px; font-weight:800; color="#111827"; margin-top:5px; letter-spacing:0.3px;">
                Tap or Scan
              </span>
            </div>

            <!-- QR Code + Small Activation Code -->
            <div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
              <div style="padding:6px; border:2px solid #111827; border-radius:12px; background:#ffffff;">
                <img src="${qrImageUrl}" alt="QR Code" style="width:115px; height:115px; display:block;" />
              </div>
              <span style="font-size:10px; font-weight:700; color:#4b5563; margin-top:5px; font-family:monospace; letter-spacing:0.5px;">
                Act: ${displayActCode}
              </span>
            </div>
          </div>
        </div>
      `;

    case 'simple':
      return `
        <div style="text-align:center; padding:36px; border:2px solid #e5e7eb; border-radius:20px; max-width:300px; margin:12px auto; background:#ffffff; page-break-inside:avoid; font-family:'Inter',system-ui,sans-serif;">
          <h2 style="font-size:22px; color:#111827; margin:0 0 16px; font-weight:800; letter-spacing:3px;">SCAN ME</h2>
          <div style="display:inline-block; padding:8px; border:2px solid #111827; border-radius:12px; background:#ffffff; margin-bottom:12px;">
            <img src="${qrImageUrl}" alt="QR Code" style="width:180px; height:180px; display:block;" />
          </div>
          <p style="font-family:monospace; font-size:11px; font-weight:700; color:#4b5563; margin:0 0 4px; letter-spacing:0.5px;">Act Code: ${displayActCode}</p>
          <p style="font-size:12px; color:#6b7280; margin:0;">Scan to visit</p>
        </div>
      `;

    case 'business':
      return `
        <div style="text-align:center; padding:36px 30px; border:2px solid #e5e7eb; border-radius:20px; max-width:340px; margin:12px auto; background:#ffffff; page-break-inside:avoid; font-family:'Inter',system-ui,sans-serif;">
          <h2 style="font-size:18px; color:#111827; margin:0 0 4px; font-weight:800; text-transform:uppercase; letter-spacing:1.5px;">${businessName}</h2>
          <p style="font-size:13px; color:#4b5563; margin:0 0 16px; font-weight:600;">SCAN TO REVIEW US</p>
          <div style="display:inline-block; padding:8px; border:2px solid #111827; border-radius:12px; background:#ffffff; margin-bottom:12px;">
            <img src="${qrImageUrl}" alt="QR Code" style="width:180px; height:180px; display:block;" />
          </div>
          <p style="font-family:monospace; font-size:11px; font-weight:700; color:#4b5563; margin:0 0 4px; letter-spacing:0.5px;">Act Code: ${displayActCode}</p>
          <p style="font-size:12px; color:#6b7280; margin:0;">Thank you for your feedback!</p>
        </div>
      `;
  }
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('google-review-square');
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
      // Auto-select all by default for convenience
      setSelectedQRs(new Set(records.map(r => r.id)));
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
        const effectiveUrl = getEffectiveRedirectURL(qr.redirectUrl, qr.qrId);
        const imageUrl = await generateQRDataURL(effectiveUrl, 400);
        htmlParts.push(generateTemplateHTML(selectedTemplate, imageUrl, qr.qrId, qr.activationCode, businessName));
      }

      const gridCols = selectedSize === 'business-card' ? 3 : selectedSize === 'a5' ? 2 : 1;
      const html = `
        <div style="display:grid; grid-template-columns:repeat(${gridCols}, 1fr); gap:20px; padding:20px; justify-items:center;">
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

  const toggleSelectAll = () => {
    if (selectedQRs.size === qrCodes.length) {
      setSelectedQRs(new Set());
    } else {
      setSelectedQRs(new Set(qrCodes.map(q => q.id)));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Print Templates</h1>
        <p className="text-sm text-gray-400 mt-1">
          Choose a professional standee or card design with your QR code and small activation code.
        </p>
      </div>

      {/* Template Selection Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => setSelectedTemplate(tpl.id)}
            className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
              selectedTemplate === tpl.id
                ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500 shadow-xl shadow-violet-500/10'
                : 'border-gray-800/60 bg-gray-900/40 hover:bg-gray-800/30'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tpl.color} flex items-center justify-center text-white shadow-md`}>
                  <tpl.icon className="w-5 h-5" />
                </div>
                {selectedTemplate === tpl.id ? (
                  <span className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white">
                    <Check className="w-4 h-4" />
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-medium">
                    {tpl.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">{tpl.name}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{tpl.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-800/40 flex items-center justify-between text-[11px] text-gray-500">
              <span>Includes Activation Code</span>
              <span className="text-violet-400 font-semibold">{selectedTemplate === tpl.id ? 'Selected' : 'Select'}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Options & Configuration */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6 space-y-6">
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

        {/* Print Size Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Select Print Size</label>
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

      {/* QR Code Selection Area */}
      {!selectMode ? (
        <button
          onClick={loadQRCodes}
          disabled={loadingQRs}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-xl shadow-violet-500/25 disabled:opacity-50"
        >
          {loadingQRs ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Palette className="w-5 h-5" />
              Select QR Codes & Print Template
            </>
          )}
        </button>
      ) : (
        <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Select QR Codes to Print
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedQRs.size} of {qrCodes.length} QR code(s) selected
              </p>
            </div>
            <button
              onClick={toggleSelectAll}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              {selectedQRs.size === qrCodes.length ? 'Deselect All' : 'Select All'}
            </button>
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
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-800/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQRs.has(qr.id)}
                        onChange={() => toggleQR(qr.id)}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-violet-500 focus:ring-violet-500/50"
                      />
                      <div>
                        <span className="font-mono text-sm text-gray-200 font-semibold">{qr.qrId}</span>
                        <span className="font-mono text-xs text-gray-500 ml-3">Act: {qr.activationCode}</span>
                      </div>
                    </div>
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-xl shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {printing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Printer className="w-5 h-5" />
                      Print {selectedQRs.size} Standee / Card{selectedQRs.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Live Interactive Template Preview */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-violet-400" />
            Live Preview (How it will print)
          </h2>
          <span className="text-xs text-gray-400 font-mono">
            {templates.find(t => t.id === selectedTemplate)?.name}
          </span>
        </div>

        <div className="bg-gray-950/60 border border-gray-800/50 rounded-2xl p-6 sm:p-10 flex items-center justify-center overflow-x-auto">
          {/* Square Google Review Preview */}
          {selectedTemplate === 'google-review-square' && (
            <div className="w-[320px] rounded-[26px] bg-white shadow-2xl border border-gray-200 overflow-hidden text-black flex flex-col relative">
              <div className="bg-[#1a73e8] text-white p-5 pb-9 text-center relative">
                <h2 className="text-[14px] font-extrabold tracking-wider uppercase leading-snug">
                  MAKE OUR DAY,<br />LEAVE US A REVIEW!
                </h2>
                <div className="text-[16px] text-[#fbbc04] tracking-widest mt-1">★★★★★</div>
                <svg viewBox="0 0 500 60" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[26px]">
                  <path d="M0,20 C150,60 350,0 500,40 L500,60 L0,60 Z" fill="#ffffff"></path>
                </svg>
              </div>
              <div className="absolute top-[102px] left-1/2 -translate-x-1/2 w-[60px] h-[60px] bg-white rounded-full shadow-lg flex items-center justify-center z-10">
                <svg viewBox="0 0 24 24" className="w-[40px] h-[40px]">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div className="p-6 pt-9 flex items-center justify-around bg-white">
                <div className="flex flex-col items-center text-center">
                  <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-gray-900 fill-none stroke-[2.6]" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="18" y="10" width="22" height="38" rx="4" fill="#ffffff"/>
                    <line x1="25" y1="15" x2="33" y2="15"/>
                    <path d="M44 24c2.5 1.8 4 4.3 4 7s-1.5 5.2-4 7"/>
                    <path d="M48 20c4.5 3 7 7 7 11s-2.5 8-7 11"/>
                    <path d="M10 44c4-2 7-6 11-10l5 3-4 6c-2 3-5 5-8 6z"/>
                  </svg>
                  <span className="text-[11px] font-extrabold text-gray-900 mt-1 leading-tight">TAP<br/>OR<br/>SCAN</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="p-1.5 border-2 border-gray-900 rounded-xl bg-white">
                    <div className="w-[100px] h-[100px] bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                      [ QR CODE ]
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 mt-1 font-mono">Act: ACT-320371</span>
                </div>
              </div>
            </div>
          )}

          {/* Vertical Google Review Preview */}
          {selectedTemplate === 'google-review-vertical' && (
            <div className="w-[260px] h-[410px] rounded-[26px] bg-white shadow-2xl border border-gray-200 overflow-hidden text-black flex flex-col relative">
              <div className="bg-[#1a73e8] text-white p-5 pb-11 text-center relative">
                <h2 className="text-[16px] font-extrabold tracking-wide">Review us on Google</h2>
                <svg viewBox="0 0 500 80" preserveAspectRatio="none" className="absolute bottom-0 left-0 w-full h-[28px]">
                  <path d="M0,30 C180,80 320,0 500,45 L500,80 L0,80 Z" fill="#ffffff"></path>
                </svg>
              </div>
              <div className="absolute top-[68px] left-1/2 -translate-x-1/2 w-[76px] h-[76px] bg-white rounded-full shadow-lg flex items-center justify-center z-10">
                <svg viewBox="0 0 24 24" className="w-[50px] h-[50px]">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              </div>
              <div className="text-center mt-9 text-[20px] text-[#fbbc04] tracking-widest">★★★★★</div>
              <div className="flex-1 p-4 flex items-center justify-around bg-white">
                <div className="flex flex-col items-center text-center">
                  <svg viewBox="0 0 64 64" className="w-12 h-12 stroke-gray-900 fill-none stroke-[2.6]" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="18" y="10" width="22" height="38" rx="4" fill="#ffffff"/>
                    <line x1="25" y1="15" x2="33" y2="15"/>
                    <path d="M44 24c2.5 1.8 4 4.3 4 7s-1.5 5.2-4 7"/>
                    <path d="M48 20c4.5 3 7 7 7 11s-2.5 8-7 11"/>
                    <path d="M10 44c4-2 7-6 11-10l5 3-4 6c-2 3-5 5-8 6z"/>
                  </svg>
                  <span className="text-[12px] font-extrabold text-gray-900 mt-1">Tap or Scan</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="p-1.5 border-2 border-gray-900 rounded-xl bg-white">
                    <div className="w-[100px] h-[100px] bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-mono">
                      [ QR CODE ]
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 mt-1 font-mono">Act: ACT-320371</span>
                </div>
              </div>
            </div>
          )}

          {/* Simple Minimalist Preview */}
          {selectedTemplate === 'simple' && (
            <div className="text-center p-8 border-2 border-gray-200 rounded-2xl max-w-[280px] bg-white text-gray-900 shadow-xl">
              <h3 className="text-xl font-extrabold tracking-widest mb-4 text-gray-900">SCAN ME</h3>
              <div className="p-2 border-2 border-gray-900 rounded-xl inline-block bg-white mb-3">
                <div className="w-[150px] h-[150px] bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-mono">
                  [ QR CODE ]
                </div>
              </div>
              <p className="font-mono text-xs font-bold text-gray-600 mb-1">Act Code: ACT-320371</p>
              <p className="text-xs text-gray-500">Scan to visit</p>
            </div>
          )}

          {/* Business Preview */}
          {selectedTemplate === 'business' && (
            <div className="text-center p-8 border-2 border-gray-200 rounded-2xl max-w-[300px] bg-white text-gray-900 shadow-xl">
              <h3 className="text-lg font-extrabold tracking-wider uppercase text-gray-900 mb-1">{businessName}</h3>
              <p className="text-xs font-bold text-gray-600 tracking-wide uppercase mb-4">SCAN TO REVIEW US</p>
              <div className="p-2 border-2 border-gray-900 rounded-xl inline-block bg-white mb-3">
                <div className="w-[150px] h-[150px] bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-mono">
                  [ QR CODE ]
                </div>
              </div>
              <p className="font-mono text-xs font-bold text-gray-600 mb-1">Act Code: ACT-320371</p>
              <p className="text-xs text-gray-500">Thank you for your feedback!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
