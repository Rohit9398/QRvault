'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFirebaseConfigured) {
      toast.error('Firebase setup required! Please configure .env.local with your Firebase keys.', { duration: 6000 });
      return;
    }
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (err.code === 'auth/invalid-credential') {
        toast.error('Invalid email or password');
      } else if (err.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password sign-in is not enabled in your Firebase Console');
      } else if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
        toast.error('Invalid Firebase API key. Please check .env.local');
      } else if (err.code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later');
      } else {
        toast.error(err.message || 'Failed to login. Please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
      <p className="text-gray-400 mb-6">Sign in to your QRVault account</p>

      {!isFirebaseConfigured && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed">
          <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            Firebase Setup Required
          </div>
          <p className="text-amber-300/90 mb-2">
            Login karne ke liye aapko Firebase project credentials <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[11px]">.env.local</code> me add karne honge.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
