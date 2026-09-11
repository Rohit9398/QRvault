'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlanAndUsage, PlanTier } from '@/lib/firestore';
import UpgradeModal from '@/components/UpgradeModal';
import {
  LayoutDashboard,
  QrCode,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Palette,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  Menu,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Generate QR Codes', href: '/dashboard/generate', icon: PlusCircle },
  { name: 'QR Codes', href: '/dashboard/qrs', icon: QrCode },
  { name: 'Activated QR Codes', href: '/dashboard/qrs?status=active', icon: CheckCircle2 },
  { name: 'Inactive QR Codes', href: '/dashboard/qrs?status=inactive', icon: XCircle },
  { name: 'Templates', href: '/dashboard/templates', icon: Palette },
  { name: 'Pricing & Plans', href: '/dashboard/pricing', icon: Sparkles },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [planData, setPlanData] = useState<{
    plan: PlanTier;
    planName: string;
    qrLimit: number;
    qrUsed: number;
  }>({
    plan: 'free',
    planName: 'Free Trial',
    qrLimit: 3,
    qrUsed: 0,
  });

  const loadPlanUsage = async () => {
    if (!user) return;
    try {
      const data = await getUserPlanAndUsage(user.uid);
      setPlanData(data);
    } catch (err) {
      console.error('Failed to load plan usage:', err);
    }
  };

  useEffect(() => {
    loadPlanUsage();
  }, [user, pathname]);

  const isActive = (href: string) => {
    if (href.includes('?')) {
      return pathname === href.split('?')[0];
    }
    return pathname === href;
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const usagePercent = Math.min(100, Math.round((planData.qrUsed / planData.qrLimit) * 100));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800/50">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight">QRVault</span>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${active
                  ? 'bg-violet-500/15 text-violet-300 shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                }`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Plan Quota Widget */}
      {!collapsed && (
        <div className="mx-3 mb-2 p-3.5 rounded-2xl bg-gradient-to-b from-gray-900/90 to-gray-950 border border-gray-800/80 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              {planData.planName}
            </span>
            <button
              onClick={() => setUpgradeModalOpen(true)}
              className="text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" /> Upgrade
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>QR Quota</span>
              <span className="font-mono text-gray-300 font-medium">
                {planData.qrUsed} / {planData.qrLimit >= 999999 ? '∞' : planData.qrLimit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercent >= 90
                    ? 'bg-gradient-to-r from-red-500 to-amber-500'
                    : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                }`}
                style={{ width: `${planData.qrLimit >= 999999 ? 15 : Math.min(100, Math.max(8, usagePercent))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User section */}
      <div className="border-t border-gray-800/50 p-3 space-y-1">
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 w-full cursor-pointer"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={planData.plan}
        onPlanUpgraded={() => loadPlanUsage()}
      />
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-950/95 backdrop-blur-xl border-r border-gray-800/50 transform transition-transform duration-300 lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-gray-950/80 backdrop-blur-xl border-r border-gray-800/50 transition-all duration-300
          ${collapsed ? 'w-20' : 'w-72'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile menu button (rendered separately, positioned in header) */}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-800/50 text-gray-400 hover:text-white transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
