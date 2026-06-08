'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { BookOpen, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSuccess(t('auth.recoveryLinkSuccess'));
    }, 1200);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <BookOpen className="h-10 w-10 text-indigo-600 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900">{t('auth.resetPasswordTitle')}</h2>
          <p className="text-xs text-slate-500">{t('auth.resetPasswordSubtitle')}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-start gap-2">
            <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{success}</span>
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
                placeholder="email@example.com"
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
          >
            {loading ? t('auth.dispatchingResetLink') : t('auth.sendRecoveryInstructions')}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500 border-t border-slate-100 pt-4">
          {t('auth.rememberedPassword')}{' '}
          <Link href="/auth/login" className="text-indigo-600 font-semibold hover:underline">
            {t('login')}
          </Link>
        </div>
      </div>
    </div>
  );
}
