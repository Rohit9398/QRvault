'use client';

import Link from 'next/link';
import { QrCode, Zap, Shield, BarChart3, Printer, Layers, ArrowRight, Sparkles, Globe } from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: 'Bulk QR Generation',
    description: 'Generate hundreds or thousands of unique QR codes in seconds with a single click.',
    color: 'from-violet-500 to-indigo-500',
  },
  {
    icon: Globe,
    title: 'Dynamic Destinations',
    description: 'Change where your QR codes point without reprinting. Update URLs anytime.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Unique Activation Codes',
    description: 'Each QR code has a cryptographically secure activation code for controlled rollout.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: BarChart3,
    title: 'QR Analytics',
    description: 'Track scans, monitor engagement, and understand how your QR codes perform.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Printer,
    title: 'Print-Ready Templates',
    description: 'Professional templates for Google Reviews, business cards, and marketing materials.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Zap,
    title: 'Secure Authentication',
    description: 'Enterprise-grade security with Firebase Authentication and Firestore rules.',
    color: 'from-purple-500 to-violet-500',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 grid-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">QRVault</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/pricing"
                className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/activate"
                className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Activate Card
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-violet-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8 animate-fadeIn">
            <Sparkles className="w-4 h-4" />
            Dynamic QR Code Platform
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[1.15] animate-fadeIn">
            <span className="text-white block sm:inline">Create. Activate. Manage.</span>{' '}
            <span className="gradient-text inline-block py-1">Dynamic QR Codes.</span>
          </h1>
          
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Generate thousands of QR codes, activate them with unique codes, 
            and change destinations anytime — without reprinting.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/signup"
              className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-3.5 text-sm font-semibold text-gray-300 bg-gray-900/50 border border-gray-700/50 rounded-xl hover:bg-gray-800/50 hover:text-white transition-all"
            >
              Login to Dashboard
            </Link>
          </div>

          {/* Hero visual */}
          <div className="mt-16 relative animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className="relative mx-auto max-w-4xl rounded-2xl border border-gray-800/50 bg-gray-900/30 backdrop-blur-sm overflow-hidden shadow-2xl shadow-violet-500/5 animate-pulse-glow">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800/50">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                <span className="ml-2 text-xs text-gray-500">QRVault Dashboard</span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Total QR Codes', value: '1,247', color: 'text-violet-400' },
                    { label: 'Active', value: '892', color: 'text-emerald-400' },
                    { label: 'Inactive', value: '355', color: 'text-amber-400' },
                    { label: 'Total Scans', value: '15.2K', color: 'text-blue-400' },
                  ].map((card, i) => (
                    <div key={i} className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30">
                      <p className="text-xs text-gray-500">{card.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 space-y-2">
                  {[
                    { id: 'QR-8F42K9', status: 'Active', dest: 'Google Review', color: 'bg-emerald-500' },
                    { id: 'QR-19AX72', status: 'Inactive', dest: '—', color: 'bg-amber-500' },
                    { id: 'QR-73PLQ1', status: 'Active', dest: 'Website', color: 'bg-emerald-500' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-gray-800/20 text-sm">
                      <span className="text-gray-300 font-mono">{row.id}</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${row.color}`} />
                        <span className="text-gray-400">{row.status}</span>
                      </div>
                      <span className="text-gray-500 hidden sm:block">{row.dest}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Everything you need for{' '}
              <span className="gradient-text">QR management</span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Powerful features designed for businesses that need to manage QR codes at scale.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl border border-gray-800/50 bg-gray-900/30 hover:bg-gray-900/50 backdrop-blur-sm transition-all duration-300 hover:border-gray-700/50 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              How it <span className="gradient-text">works</span>
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Generate', desc: 'Create bulk QR codes instantly' },
              { step: '02', title: 'Distribute', desc: 'Print and share your QR codes' },
              { step: '03', title: 'Activate', desc: 'Use activation codes to go live' },
              { step: '04', title: 'Manage', desc: 'Change destinations anytime' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold gradient-text">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600/20 via-indigo-600/20 to-purple-600/20 border border-violet-500/20 p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to get started?
              </h2>
              <p className="text-gray-300 mb-8 max-w-xl mx-auto">
                Create your free account and start generating dynamic QR codes today.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/30 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-400">QRVault</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 QRVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
