'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserPlan, PlanTier, PLAN_LIMITS } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { X, Check, Zap, Sparkles, ShieldCheck, Crown } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: PlanTier;
  onPlanUpgraded?: () => void;
  reasonMessage?: string;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  onPlanUpgraded,
  reasonMessage,
}: UpgradeModalProps) {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [upgradingTo, setUpgradingTo] = useState<PlanTier | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async (plan: PlanTier) => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (plan === currentPlan) {
      toast('You are already on this plan!', { icon: 'ℹ️' });
      return;
    }

    setUpgradingTo(plan);
    try {
      await updateUserPlan(user.uid, plan);
      toast.success(`Upgraded to ${PLAN_LIMITS[plan].name}! 🎉`);
      onPlanUpgraded?.();
      onClose();
    } catch (err) {
      console.error('Failed to upgrade plan:', err);
      toast.error('Failed to upgrade plan. Please try again.');
    } finally {
      setUpgradingTo(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-3xl bg-gray-950 border border-gray-800 shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-gray-900/80 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Unlock Pro Power
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Upgrade Your QR Experience
          </h2>
          <p className="text-sm text-gray-400">
            {reasonMessage || 'Generate more dynamic QRs, unlock high-res standee templates, and enjoy unlimited trackable scans.'}
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-2 p-1 mt-5 rounded-xl bg-gray-900/90 border border-gray-800 text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                SAVE 70%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-2 gap-5 mt-6">
          {/* Starter Plan */}
          <div className="relative rounded-2xl bg-gray-900/50 border border-violet-500/30 p-6 flex flex-col justify-between hover:border-violet-500/60 transition-all">
            <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold border border-violet-500/30">
              Popular
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-violet-400" />
                <h3 className="text-lg font-bold text-white">Starter Pro</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Perfect for shops, gyms, cafes, and personal brands.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-white">
                  ₹{billingCycle === 'yearly' ? PLAN_LIMITS.starter.priceYearly : PLAN_LIMITS.starter.priceMonthly}
                </span>
                <span className="text-xs text-gray-500">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>

              <div className="space-y-2.5 mb-6">
                {PLAN_LIMITS.starter.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleUpgrade('starter')}
              disabled={upgradingTo !== null || currentPlan === 'starter'}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {upgradingTo === 'starter' ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : currentPlan === 'starter' ? (
                'Current Plan'
              ) : (
                'Upgrade to Starter Pro'
              )}
            </button>
          </div>

          {/* Business VIP Plan */}
          <div className="relative rounded-2xl bg-gradient-to-b from-gray-900/80 to-gray-950 border-2 border-amber-500/40 p-6 flex flex-col justify-between hover:border-amber-500/70 transition-all shadow-xl shadow-amber-500/5">
            <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" /> Unlimited
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Business VIP</h3>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                For agencies, retail chains, and enterprise teams.
              </p>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-white">
                  ₹{billingCycle === 'yearly' ? PLAN_LIMITS.business.priceYearly : PLAN_LIMITS.business.priceMonthly}
                </span>
                <span className="text-xs text-gray-500">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>

              <div className="space-y-2.5 mb-6">
                {PLAN_LIMITS.business.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleUpgrade('business')}
              disabled={upgradingTo !== null || currentPlan === 'business'}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-gray-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 font-bold"
            >
              {upgradingTo === 'business' ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : currentPlan === 'business' ? (
                'Current Plan'
              ) : (
                'Get Business VIP'
              )}
            </button>
          </div>
        </div>

        {/* Footer reassurance */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Instant Activation
          </span>
          <span>•</span>
          <span>Cancel Anytime</span>
          <span>•</span>
          <span>100% Secure Checkout</span>
        </div>
      </div>
    </div>
  );
}
