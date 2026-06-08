'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, KeyRound, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <BookOpen className="h-10 w-10 text-indigo-600 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900">{t('auth.loginTitle')}</h2>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('auth.email')}</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('auth.password')}</label>
              <Link href="/auth/forgot-password" className="text-xs text-indigo-600 font-semibold hover:underline">
                {t('auth.forgotPasswordLink')}
              </Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition-all duration-200 active:scale-95 text-sm"
          >
            {loading ? 'Logging in...' : t('login')}
          </button>
        </form>

        <div className="relative flex py-2 items-center text-xs text-slate-400 uppercase font-bold tracking-wider">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4">Or</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button
          type="button"
          onClick={() => alert('Google authentication integration structure is ready! In production, this redirects to the OAuth provider callback.')}
          className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.52 0-6.386-2.866-6.386-6.386s2.866-6.386 6.386-6.386c1.63 0 3.117.618 4.254 1.628l3.056-3.056C19.263 2.502 15.973 1 12.24 1C6.032 1 1 6.032 1 12.24s5.032 11.24 11.24 11.24c5.898 0 11.088-4.255 11.088-11.24 0-.768-.078-1.5-.223-1.955H12.24z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="text-center text-sm text-slate-500 border-t border-slate-100 pt-4">
          {t('auth.dontHaveAccount')}{' '}
          <Link href="/auth/register" className="text-indigo-600 font-semibold hover:underline">
            {t('register')}
          </Link>
        </div>
      </div>
    </div>
  );
}
