'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { getUserQRCodes, searchQRCodes, deleteQRCode, deactivateQRCode, activateQRCode, QRCodeRecord } from '@/lib/firestore';
import { downloadQRAsPNG, downloadQRsAsZIP } from '@/lib/download-utils';
import StatusBadge from '@/components/StatusBadge';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Search, Filter, Download, Trash2, Eye, Edit3, QrCode,
  ChevronLeft, ChevronRight, MoreHorizontal, Power, PowerOff,
  Printer, Loader2, X, CheckCircle2,
} from 'lucide-react';

function QRCodesPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  
  const [qrCodes, setQrCodes] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam || 'all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const pageSize = 20;

  const fetchQRCodes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (searchTerm) {
        const results = await searchQRCodes(user.uid, searchTerm);
        const filtered = statusFilter !== 'all' 
          ? results.filter(r => r.status === statusFilter) 
          : results;
        setQrCodes(filtered);
      } else {
        const { records } = await getUserQRCodes(user.uid, statusFilter, undefined, 200);
        setQrCodes(records);
      }
    } catch (error) {
      console.error('Failed to fetch QR codes:', error);
      const err = error as { message?: string; code?: string };
      toast.error(err.message || 'Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, statusFilter]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  useEffect(() => {
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [statusParam]);

  const paginatedQRs = qrCodes.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(qrCodes.length / pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedQRs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedQRs.map(q => q.id)));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteQRCode(id);
      toast.success('QR code deleted');
      setDeleteConfirmId(null);
      fetchQRCodes();
    } catch {
      toast.error('Failed to delete QR code');
    }
  };

  const handleToggleStatus = async (qr: QRCodeRecord) => {
    try {
      if (qr.status === 'active') {
        await deactivateQRCode(qr.id);
        toast.success(`${qr.qrId} deactivated`);
      } else {
        await activateQRCode(qr.id);
        toast.success(`${qr.qrId} activated`);
      }
      fetchQRCodes();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleBulkDownload = async () => {
    const selected = qrCodes.filter(q => selectedIds.has(q.id));
    if (selected.length === 0) {
      toast.error('Select QR codes to download');
      return;
    }
    
    toast.loading('Preparing download...', { id: 'bulk-download' });
    try {
      await downloadQRsAsZIP(
        selected.map(q => ({ qrId: q.qrId, redirectUrl: q.redirectUrl })),
        'png'
      );
      toast.success('Download ready!', { id: 'bulk-download' });
    } catch {
      toast.error('Download failed', { id: 'bulk-download' });
    }
  };

  const handleSingleDownload = async (qr: QRCodeRecord) => {
    try {
      await downloadQRAsPNG(qr.redirectUrl, qr.qrId);
      toast.success(`${qr.qrId} downloaded`);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">QR Codes</h1>
          <p className="text-sm text-gray-400 mt-1">{qrCodes.length} total QR codes</p>
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{selectedIds.size} selected</span>
            <button
              onClick={handleBulkDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-500 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download ZIP
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Search by QR ID, activation code, or destination..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="pl-10 pr-8 py-2.5 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : paginatedQRs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <QrCode className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No QR codes found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Try a different search term' : 'Generate QR codes to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-800/50">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedQRs.length && paginatedQRs.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-violet-500 focus:ring-violet-500/50"
                    />
                  </th>
                  <th className="px-4 py-3">QR ID</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Activation Code</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Destination</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Scans</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {paginatedQRs.map((qr) => (
                  <tr key={qr.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(qr.id)}
                        onChange={() => toggleSelect(qr.id)}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-violet-500 focus:ring-violet-500/50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/qrs/${qr.id}`} className="font-mono text-sm text-violet-400 hover:text-violet-300">
                        {qr.qrId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-sm text-gray-400">{qr.activationCode}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={qr.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-400 truncate max-w-[200px] block">
                        {qr.destinationUrl || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-400">{qr.scanCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenuId(actionMenuId === qr.id ? null : qr.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {actionMenuId === qr.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                            <div className="absolute right-0 mt-1 z-20 w-48 rounded-xl bg-gray-900 border border-gray-800/50 shadow-xl py-1 animate-fadeIn">
                              <Link
                                href={`/dashboard/qrs/${qr.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 transition-colors"
                                onClick={() => setActionMenuId(null)}
                              >
                                <Eye className="w-4 h-4" /> View Details
                              </Link>
                              <Link
                                href={`/dashboard/qrs/${qr.id}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 transition-colors"
                                onClick={() => setActionMenuId(null)}
                              >
                                <Edit3 className="w-4 h-4" /> Edit Destination
                              </Link>
                              <button
                                onClick={() => { handleSingleDownload(qr); setActionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 transition-colors"
                              >
                                <Download className="w-4 h-4" /> Download PNG
                              </button>
                              <button
                                onClick={() => { handleToggleStatus(qr); setActionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800/50 transition-colors"
                              >
                                {qr.status === 'active' ? (
                                  <><PowerOff className="w-4 h-4" /> Deactivate</>
                                ) : (
                                  <><Power className="w-4 h-4" /> Activate</>
                                )}
                              </button>
                              <div className="border-t border-gray-800/50 my-1" />
                              <button
                                onClick={() => { setDeleteConfirmId(qr.id); setActionMenuId(null); }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800/50">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-800/50 p-6 animate-fadeIn">
            <h3 className="text-lg font-semibold text-white mb-2">Delete QR Code</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete this QR code? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800/50 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QRCodesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    }>
      <QRCodesPageContent />
    </Suspense>
  );
}
