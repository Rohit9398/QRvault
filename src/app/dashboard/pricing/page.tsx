'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlanAndUsage, updateUserPlan, PlanTier, PLAN_LIMITS } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { Zap, Crown, Check, Sparkles, ShieldCheck, HelpCircle } from 'lucide-react';

export default function DashboardPricingPage() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [upgradingTo, setUpgradingTo] = useState<PlanTier | null>(null);
  const [planUsage, setPlanUsage] = useState<{
    plan: PlanTier;
    planName: string;
    qrLimit: number;
    qrUsed: number;
    remaining: number;
  }>({
    plan: 'free',
    planName: 'Free Trial',
    qrLimit: 3,
    qrUsed: 0,
    remaining: 3,
  });

  const loadUsage = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserPlanAndUsage(user.uid);
      setPlanUsage(data);
    } catch (err) {
      console.error('Failed to load plan usage:', err);
    }
  }, [user]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const handleSelectPlan = async (targetPlan: PlanTier) => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    if (targetPlan === planUsage.plan) {
      toast('You are currently on this plan!', { icon: 'ℹ️' });
      return;
    }

    setUpgradingTo(targetPlan);
    try {
      await updateUserPlan(user.uid, targetPlan);
      toast.success(`Plan updated to ${PLAN_LIMITS[targetPlan].name}! 🎉`);
      await loadUsage();
    } catch (err) {
      console.error('Failed to update plan:', err);
      toast.error('Failed to update plan');
    } finally {
      setUpgradingTo(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Flexible & Transparent Plans
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Choose the Perfect Plan for Your Growth
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">
          Unlock dynamic QR superpowers, custom review standees, and instant scan analytics.
        </p>

        {/* Current Plan Status Pill */}
        <div className="pt-2">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300">
            Current Plan: <strong className="text-violet-400">{planUsage.planName}</strong> ({planUsage.qrUsed}/{planUsage.qrLimit >= 999999 ? '∞' : planUsage.qrLimit} QRs Used)
          </span>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="inline-flex items-center gap-2 p-1 mt-4 rounded-xl bg-gray-900/90 border border-gray-800 text-xs font-semibold">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
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
      <div className="grid md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="rounded-3xl bg-gray-900/40 border border-gray-800 p-6 flex flex-col justify-between hover:border-gray-700 transition-all">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">{PLAN_LIMITS.free.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 text-xs font-medium">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Ideal for testing out dynamic QR redirection.
            </p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-extrabold text-white">₹0</span>
              <span className="text-xs text-gray-500">/forever</span>
            </div>

            <div className="space-y-3 mb-6">
              {PLAN_LIMITS.free.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-gray-300">
                  <Check className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleSelectPlan('free')}
            disabled={planUsage.plan === 'free'}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-300 bg-gray-800/80 hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {planUsage.plan === 'free' ? 'Current Active Plan' : 'Downgrade to Free'}
          </button>
        </div>

        {/* Starter Plan */}
        <div className="relative rounded-3xl bg-gradient-to-b from-violet-950/30 via-gray-900/80 to-gray-950 border-2 border-violet-500/50 p-6 flex flex-col justify-between shadow-2xl shadow-violet-500/10 hover:border-violet-400 transition-all">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold shadow-md uppercase tracking-wider">
            Most Popular
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 mt-1">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-violet-400" />
                <h3 className="text-lg font-bold text-white">{PLAN_LIMITS.starter.name}</h3>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Ideal for stores, restaurants, gyms & consultants.
            </p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">
                ₹{billingCycle === 'yearly' ? PLAN_LIMITS.starter.priceYearly : PLAN_LIMITS.starter.priceMonthly}
              </span>
              <span className="text-xs text-gray-400">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {PLAN_LIMITS.starter.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleSelectPlan('starter')}
            disabled={upgradingTo !== null || planUsage.plan === 'starter'}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {upgradingTo === 'starter' ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : planUsage.plan === 'starter' ? (
              'Current Active Plan'
            ) : (
              'Upgrade to Starter Pro'
            )}
          </button>
        </div>

        {/* Business Plan */}
        <div className="relative rounded-3xl bg-gradient-to-b from-amber-950/20 via-gray-900/80 to-gray-950 border-2 border-amber-500/40 p-6 flex flex-col justify-between hover:border-amber-500/70 transition-all shadow-xl shadow-amber-500/5">
          <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" /> Unlimited
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 mt-1">
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-lg font-bold text-white">{PLAN_LIMITS.business.name}</h3>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-5">
              For agencies, retail chains, and enterprise businesses.
            </p>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-white">
                ₹{billingCycle === 'yearly' ? PLAN_LIMITS.business.priceYearly : PLAN_LIMITS.business.priceMonthly}
              </span>
              <span className="text-xs text-gray-400">
                /{billingCycle === 'yearly' ? 'year' : 'month'}
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {PLAN_LIMITS.business.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleSelectPlan('business')}
            disabled={upgradingTo !== null || planUsage.plan === 'business'}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-gray-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 font-bold"
          >
            {upgradingTo === 'business' ? (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : planUsage.plan === 'business' ? (
              'Current Active Plan'
            ) : (
              'Get Business VIP'
            )}
          </button>
        </div>
      </div>

      {/* Trust & Guarantee banner */}
      <div className="p-6 rounded-3xl bg-gray-900/30 border border-gray-800/80 flex flex-col sm:flex-row items-center justify-around gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white">Instant Activation</h4>
            <p className="text-xs text-gray-400">Your upgraded quota is unlocked immediately.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-violet-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white">Cancel Anytime</h4>
            <p className="text-xs text-gray-400">No lock-ins. Switch or cancel whenever you wish.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <HelpCircle className="w-8 h-8 text-blue-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-white">Priority Support</h4>
            <p className="text-xs text-gray-400">Need a custom bulk plan? Contact us anytime.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
