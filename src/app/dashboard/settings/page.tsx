'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, User, Globe, Shield, Save, Loader2, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user, resetPassword } = useAuth();
  const [appUrl, setAppUrl] = useState(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      const currentOrigin = window.location.origin;
      if (!currentOrigin.includes('localhost')) {
        setAppUrl(currentOrigin);
      }
    }
  }, []);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setResetting(true);
    try {
      await resetPassword(user.email);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <p className="text-xs text-gray-500">Your account information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-400 text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">User ID</label>
            <input
              type="text"
              value={user?.uid || ''}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-400 text-sm font-mono cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* App Configuration */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">App Configuration</h2>
            <p className="text-xs text-gray-500">QR code redirect settings</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">App URL</label>
          <input
            type="url"
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
          />
          <p className="mt-2 text-xs text-gray-500">
            This is the base URL used in QR redirect links (e.g., {appUrl}/r/QR-XXXXX). 
            Set via NEXT_PUBLIC_APP_URL environment variable.
          </p>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Security</h2>
            <p className="text-xs text-gray-500">Manage your security settings</p>
          </div>
        </div>

        <button
          onClick={handleResetPassword}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {resetting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          Send Password Reset Email
        </button>
      </div>
    </div>
  );
}
