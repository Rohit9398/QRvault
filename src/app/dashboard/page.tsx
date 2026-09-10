'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardStats, getUserQRCodes, QRCodeRecord } from '@/lib/firestore';
import DashboardCard from '@/components/DashboardCard';
import StatusBadge from '@/components/StatusBadge';
import { QrCode, CheckCircle2, XCircle, BarChart3, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, disabled: 0, totalScans: 0 });
  const [recentQRs, setRecentQRs] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [statsData, { records }] = await Promise.all([
          getDashboardStats(user.uid),
          getUserQRCodes(user.uid, undefined, undefined, 5),
        ]);
        setStats(statsData);
        setRecentQRs(records);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <div className="h-8 w-48 bg-gray-800/50 rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-gray-800/30 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-800/20 border border-gray-800/30 animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-2xl bg-gray-800/20 border border-gray-800/30 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Welcome back, {user?.email?.split('@')[0]}</p>
        </div>
        <Link
          href="/dashboard/generate"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
        >
          <Plus className="w-4 h-4" />
          Generate QR Codes
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total QR Codes"
          value={stats.total.toLocaleString()}
          icon={QrCode}
          color="violet"
        />
        <DashboardCard
          title="Active QR Codes"
          value={stats.active.toLocaleString()}
          icon={CheckCircle2}
          color="emerald"
        />
        <DashboardCard
          title="Inactive QR Codes"
          value={(stats.inactive + stats.disabled).toLocaleString()}
          icon={XCircle}
          color="amber"
        />
        <DashboardCard
          title="Total Scans"
          value={stats.totalScans.toLocaleString()}
          icon={BarChart3}
          color="blue"
        />
      </div>

      {/* Recent QR Codes */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
          <h2 className="text-lg font-semibold text-white">Recent QR Codes</h2>
          <Link
            href="/dashboard/qrs"
            className="flex items-center gap-1 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentQRs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <QrCode className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No QR codes yet</p>
            <p className="text-sm text-gray-500 mt-1">Generate your first batch to get started</p>
            <Link
              href="/dashboard/generate"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2 text-sm font-medium text-violet-400 bg-violet-500/10 rounded-xl hover:bg-violet-500/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Generate QR Codes
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">QR ID</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 hidden sm:table-cell">Destination</th>
                  <th className="px-6 py-3 hidden md:table-cell">Scans</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30">
                {recentQRs.map((qr) => (
                  <tr key={qr.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-200">{qr.qrId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={qr.status} />
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-400 truncate max-w-[200px] block">
                        {qr.destinationUrl || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-400">{qr.scanCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/qrs/${qr.id}`}
                        className="text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
