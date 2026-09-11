'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QrCode, Zap, Crown, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { PLAN_LIMITS } from '@/lib/firestore';

export default function PublicPricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const faqs = [
    {
      q: 'What happens after I reach the 3 free QR limit?',
      a: 'Your existing QR codes will continue to work, scan, and redirect without interruption! To generate additional dynamic QRs, simply upgrade to Starter Pro or Business VIP.',
    },
    {
      q: 'Can I change my QR destination URL after printing?',
      a: 'Yes! That is the core superpower of QRVault Dynamic QRs. You can update the destination URL at any time from your dashboard without reprinting the QR code.',
    },
    {
      q: 'Are scans really unlimited?',
      a: 'Yes! All plans (even the Free Trial) support unlimited scans without any artificial caps or throttle.',
    },
    {
      q: 'Can I cancel or change my plan later?',
      a: 'Absolutely. You can upgrade, downgrade, or cancel your plan at any time directly from your dashboard.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 grid-bg text-gray-100">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">QRVault</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/activate" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
                Activate Card
              </Link>
              <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Transparent Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Simple, Predictable Plans for Everyone
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Start for free with 3 Dynamic QR codes. Upgrade anytime for higher volumes, standee print templates, and advanced analytics.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-2 p-1.5 mt-8 rounded-2xl bg-gray-900/90 border border-gray-800 text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-xl transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === 'yearly'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Annual Billing
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                SAVE 70%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {/* Free Plan */}
          <div className="rounded-3xl bg-gray-900/40 border border-gray-800 p-8 flex flex-col justify-between hover:border-gray-700 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-white">{PLAN_LIMITS.free.name}</h3>
                <span className="px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 text-xs font-medium">
                  Free Forever
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Try out dynamic QR redirection with zero commitment.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-white">₹0</span>
                <span className="text-xs text-gray-500">/forever</span>
              </div>

              <div className="space-y-3.5 mb-8">
                {PLAN_LIMITS.free.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full py-3 px-4 rounded-xl text-xs font-semibold text-center text-gray-300 bg-gray-800 hover:bg-gray-700 transition-all cursor-pointer block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Starter Plan */}
          <div className="relative rounded-3xl bg-gradient-to-b from-violet-950/30 via-gray-900/80 to-gray-950 border-2 border-violet-500/50 p-8 flex flex-col justify-between shadow-2xl shadow-violet-500/15 hover:border-violet-400 transition-all">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold shadow-md uppercase tracking-wider">
              Most Popular
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-violet-400" />
                  <h3 className="text-xl font-bold text-white">{PLAN_LIMITS.starter.name}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Ideal for cafes, restaurants, gyms, and retail shops.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-white">
                  ₹{billingCycle === 'yearly' ? PLAN_LIMITS.starter.priceYearly : PLAN_LIMITS.starter.priceMonthly}
                </span>
                <span className="text-xs text-gray-400">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>

              <div className="space-y-3.5 mb-8">
                {PLAN_LIMITS.starter.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs text-gray-200">
                    <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full py-3.5 px-4 rounded-xl text-sm font-semibold text-center text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 cursor-pointer block"
            >
              Start Starter Pro
            </Link>
          </div>

          {/* Business VIP Plan */}
          <div className="relative rounded-3xl bg-gradient-to-b from-amber-950/20 via-gray-900/80 to-gray-950 border-2 border-amber-500/40 p-8 flex flex-col justify-between hover:border-amber-500/70 transition-all shadow-xl shadow-amber-500/5">
            <div className="absolute -top-3.5 right-8 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Unlimited
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">{PLAN_LIMITS.business.name}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                For agencies, marketing teams, and enterprises.
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-extrabold text-white">
                  ₹{billingCycle === 'yearly' ? PLAN_LIMITS.business.priceYearly : PLAN_LIMITS.business.priceMonthly}
                </span>
                <span className="text-xs text-gray-400">
                  /{billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>

              <div className="space-y-3.5 mb-8">
                {PLAN_LIMITS.business.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs text-gray-200">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/signup"
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-center text-gray-950 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/25 cursor-pointer block"
            >
              Get Business VIP
            </Link>
          </div>
        </div>

        {/* FAQs Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800/80">
                <h3 className="text-base font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
