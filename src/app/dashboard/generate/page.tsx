'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { generateBulkQRCodes } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { Zap, Hash, ArrowLeftRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type GenerationMode = 'quantity' | 'range';

export default function GeneratePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<GenerationMode>('quantity');
  const [quantity, setQuantity] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [generated, setGenerated] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);

  const calculateCount = (): number => {
    if (mode === 'quantity') {
      return parseInt(quantity) || 0;
    }
    const start = parseInt(rangeStart) || 0;
    const end = parseInt(rangeEnd) || 0;
    return Math.max(0, end - start + 1);
  };

  const count = calculateCount();

  const handleGenerate = async () => {
    if (!user) return;
    if (count <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (count > 5000) {
      toast.error('Maximum 5000 QR codes per batch');
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: count });
    setGenerated(false);

    try {
      await generateBulkQRCodes(user.uid, count, (current, total) => {
        setProgress({ current, total });
      });
      
      setGenerated(true);
      setGeneratedCount(count);
      toast.success(`${count} QR codes generated successfully!`);
      
      // Reset form
      setQuantity('');
      setRangeStart('');
      setRangeEnd('');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error('Failed to generate QR codes. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Generate QR Codes</h1>
        <p className="text-sm text-gray-400 mt-1">Create multiple unique QR codes in bulk</p>
      </div>

      {/* Generation Card */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Generation Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('quantity')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  mode === 'quantity'
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-gray-800/50 bg-gray-900/50 text-gray-400 hover:bg-gray-800/30'
                }`}
              >
                <Hash className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Quantity</p>
                  <p className="text-xs text-gray-500">Enter exact number</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  mode === 'range'
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-gray-800/50 bg-gray-900/50 text-gray-400 hover:bg-gray-800/30'
                }`}
              >
                <ArrowLeftRight className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Range</p>
                  <p className="text-xs text-gray-500">Start to End</p>
                </div>
              </button>
            </div>
          </div>

          {/* Inputs */}
          {mode === 'quantity' ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of QR Codes
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g., 100"
                min="1"
                max="5000"
                className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start</label>
                <input
                  type="number"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  placeholder="e.g., 1001"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End</label>
                <input
                  type="number"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  placeholder="e.g., 1100"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {count > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
              <AlertCircle className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <p className="text-sm text-violet-300">
                You are about to generate <span className="font-bold text-violet-200">{count.toLocaleString()}</span> QR codes.
              </p>
            </div>
          )}

          {/* Progress */}
          {generating && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  Generating QR codes...
                </span>
                <span className="text-gray-300 font-mono">
                  {progress.current}/{progress.total}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {generated && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-300">
                <span className="font-bold">{generatedCount.toLocaleString()}</span> QR codes generated successfully!
              </p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || count <= 0}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Generate QR Codes
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="px-6 py-4 border-t border-gray-800/50 bg-gray-900/20">
          <p className="text-xs text-gray-500">
            Each QR code will receive a unique ID (e.g., QR-8F42K9) and activation code (e.g., ACT-729183). 
            All QR codes start as <span className="text-amber-400">inactive</span> and must be activated before use.
          </p>
        </div>
      </div>
    </div>
  );
}
