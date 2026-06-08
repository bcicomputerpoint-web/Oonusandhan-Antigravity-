'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { BookOpen, ArrowLeft, ShieldCheck, Cpu, DollarSign, Send, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface ServiceWing {
  id: string;
  name: string;
  description: string;
  priceRate: number;
}

const DEFAULT_WINGS = [
  { id: '1', name: 'Research Topic Selection', description: 'Guidance in identifying trending, high-impact research topics and domain gaps matching your specializations.', priceRate: 50 },
  { id: '2', name: 'Synopsis and Proposal Support', description: 'Comprehensive synopsis building, problem statements formatting, and technical proposal reviews.', priceRate: 100 },
  { id: '3', name: 'Literature Review Support', description: 'Thematic literature synthesis, methodology cataloging, citation checking, and research gap formulation.', priceRate: 80 },
  { id: '4', name: 'Publication Support', description: 'Draft optimization, journal layout formatting, technical proofreading, and submission support for Q1 journals.', priceRate: 150 },
  { id: '5', name: 'PhD Admission Support', description: 'Application tracking, statement of purpose (SOP) reviews, academic CV design, and admission interviews preparation.', priceRate: 120 },
  { id: '6', name: 'Academic Profile Management', description: 'Setting up, indexing, and optimizing professional academic portfolios across online university directories.', priceRate: 40 },
  { id: '7', name: 'Research ID Support', description: 'Registration, linkage audits, and indexing support for ORCID, Google Scholar, ResearchGate, and Scopus profiles.', priceRate: 30 },
  { id: '8', name: 'Training and Courses', description: 'Technical research writing, statistical computation, scientific graphing, and custom classroom analytics courses.', priceRate: 90 },
];

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  const id = params.id as string;

  const [wing, setWing] = useState<ServiceWing | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [details, setDetails] = useState('');
  const [estimatedHours, setEstimatedHours] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchWingDetails = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/wings/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.wing) {
            setWing(data.wing);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch wing details, trying defaults', err);
      }

      // Match with local default list
      const matched = DEFAULT_WINGS.find(w => w.id === id) || DEFAULT_WINGS[0];
      setWing(matched);
      setLoading(false);
    };

    fetchWingDetails();
  }, [id]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!details.trim() || details.length < 5) {
      setErrorMsg(t('services.minDetailsError'));
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wingId: wing?.id === '1' || wing?.id === '2' || wing?.id === '3' || wing?.id === '4' || wing?.id === '5' || wing?.id === '6' || wing?.id === '7' || wing?.id === '8'
            ? '12345678-1234-1234-1234-123456789012' // fallback UUID for mock ID if not a UUID
            : wing?.id,
          details,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(t('services.successMsg'));
        setDetails('');
      } else {
        setErrorMsg(data.message || 'Failed to submit request');
      }
    } catch (err) {
      setErrorMsg('Network error submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!wing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Service wing not found.
      </div>
    );
  }

  const wingName = t(`services.wings.${wing.id}.name`);
  const wingDesc = t(`services.wings.${wing.id}.desc`);
  const name = wingName.includes('services.wings') ? wing.name : wingName;
  const description = wingDesc.includes('services.wings') ? wing.description : wingDesc;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="text-xl font-black text-indigo-950 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-600" />
            <span>Onusandhan AI</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/services" className="text-sm font-bold text-indigo-600">
              {language === 'bn' ? 'সার্ভিসসমূহ' : 'Services'}
            </Link>
            <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-indigo-600">
              {t('dashboard')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Layout container */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        <Link
          href="/services"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('services.backToCatalog')}</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-3.5 bg-indigo-50 rounded-2xl">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {language === 'bn' ? 'একাডেমিক সার্ভিস উইং' : 'Academic Service Wing'}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-8">
            {/* Description & Estimator */}
            <div className="md:col-span-7 space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-700 uppercase">{t('services.serviceDescription')}</h3>
                <p className="text-sm text-slate-505 leading-relaxed">{description}</p>
              </div>

              {/* Price rate badge */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-650">{t('services.billingRate')}</span>
                <span className="text-base font-black text-indigo-600">${wing.priceRate} {t('services.perHour')}</span>
              </div>

              {/* Estimate Tool */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-700 uppercase">{t('services.budgetEstimator')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-semibold text-slate-505">
                    <span>{t('services.estimatedHours')}</span>
                    <span>{estimatedHours} {language === 'bn' ? 'ঘণ্টা' : 'hours'}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    step="5"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-150 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between items-center p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 mt-2">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">{t('services.estimatedBudget')}</span>
                    <span className="text-lg font-black text-indigo-750">${wing.priceRate * estimatedHours}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Form */}
            <div className="md:col-span-5 bg-slate-50 p-6 rounded-2xl border border-slate-150 space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Send className="h-4 w-4 text-indigo-600" />
                <span>{t('services.requestTitle')}</span>
              </h3>

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-250 text-xs text-emerald-700 flex items-start gap-2">
                  <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-250 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {user ? (
                <form onSubmit={handleSubmitRequest} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{t('services.requirements')}</label>
                    <textarea
                      rows={5}
                      required
                      placeholder={t('services.requirementPlaceholder')}
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all resize-none text-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {submitting ? (language === 'bn' ? 'জমা দেওয়া হচ্ছে...' : 'Submitting...') : t('services.submitBtn')}
                  </button>
                </form>
              ) : (
                <div className="p-4 bg-white rounded-xl border border-slate-200 text-center space-y-3 shadow-sm">
                  <p className="text-xs text-slate-500 leading-normal">
                    {t('services.loginToSubmit')}
                  </p>
                  <Link
                    href="/auth/login"
                    className="block w-full py-2 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    {t('services.loginToContinue')}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
