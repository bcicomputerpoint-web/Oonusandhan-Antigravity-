'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { 
  Check, 
  Cpu, 
  HelpCircle, 
  Star, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Loader2 
} from 'lucide-react';

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [orderingPlan, setOrderingPlan] = useState<string | null>(null);
  const [error, setError] = useState('');

  const plans = [
    {
      name: 'FREE',
      displayName: t('pricing.free'),
      price: 0,
      description: t('pricing.plans.FREE.desc'),
      features: (t('pricing.plans.FREE.features') || []) as string[],
      cta: t('pricing.plans.FREE.cta'),
      popular: false,
      icon: HelpCircle,
      iconColor: 'text-slate-505'
    },
    {
      name: 'PRO',
      displayName: t('pricing.pro'),
      price: 29,
      description: t('pricing.plans.PRO.desc'),
      features: (t('pricing.plans.PRO.features') || []) as string[],
      cta: t('pricing.plans.PRO.cta'),
      popular: true,
      icon: Sparkles,
      iconColor: 'text-amber-500'
    },
    {
      name: 'LABS',
      displayName: t('pricing.labs'),
      price: 99,
      description: t('pricing.plans.LABS.desc'),
      features: (t('pricing.plans.LABS.features') || []) as string[],
      cta: t('pricing.plans.LABS.cta'),
      popular: false,
      icon: Zap,
      iconColor: 'text-indigo-600'
    }
  ];

  const handleSelectPlan = async (plan: typeof plans[0]) => {
    if (plan.name === 'FREE') {
      router.push('/dashboard/scholar');
      return;
    }

    if (!user) {
      router.push(`/auth/login?redirect=/pricing`);
      return;
    }

    setOrderingPlan(plan.name);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName: plan.name,
          amount: plan.price,
          currency: 'USD',
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success && data.order) {
        // Redirection to payment URL (Sandbox Checkout overlay dashboard or Stripe/Razorpay checkouts)
        if (data.order.paymentUrl) {
          window.location.href = data.order.paymentUrl;
        } else {
          router.push('/dashboard/scholar');
        }
      } else {
        setError(data.message || 'Order initiation failed. Try again.');
      }
    } catch (err) {
      setError('Connection failure starting transaction checkout.');
    } finally {
      setOrderingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Navigation Top */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="text-xl font-black text-indigo-950 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-600" />
            <span>Onusandhan AI</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/services" className="text-sm font-bold text-slate-650 hover:text-indigo-650">
              Services
            </Link>
            <Link href="/courses" className="text-sm font-bold text-slate-650 hover:text-indigo-650">
              Courses
            </Link>
            <Link href="/pricing" className="text-sm font-bold text-indigo-650 hover:text-indigo-800">
              Pricing
            </Link>
            <Link href="/dashboard" className="text-sm font-bold text-slate-650 hover:text-indigo-650">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-[10px] font-bold tracking-wider text-indigo-700 uppercase">
            {t('pricing.pricingPlansCatalog')}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {t('pricing.title')}
          </h1>
          <p className="text-sm text-slate-505 font-medium leading-relaxed">
            {t('pricing.subtitle')}
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl max-w-md mx-auto">
              {error}
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isUserCurrent = !!(user && user.plan === plan.name);
            const isFree = plan.name === 'FREE';

            return (
              <div
                key={plan.name}
                className={`bg-white border rounded-3xl p-8 shadow-sm flex flex-col justify-between relative transition-all duration-300 ${
                  plan.popular 
                    ? 'border-indigo-600 ring-2 ring-indigo-600/10 -translate-y-2 shadow-md' 
                    : 'border-slate-200 hover:border-slate-350 hover:-translate-y-1'
                }`}
              >
                {plan.popular && (
                  <span className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 bg-indigo-600 text-[10px] font-black text-white rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <Star className="h-3 w-3 fill-white" />
                    <span>{t('pricing.mostPopular')}</span>
                  </span>
                )}

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-2xl ${plan.popular ? 'bg-indigo-50' : 'bg-slate-100'}`}>
                      <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{plan.displayName}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{plan.name}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-505 leading-relaxed min-h-[48px]">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 py-2 border-y border-slate-100">
                    <span className="text-4xl font-extrabold text-slate-900">${plan.price}</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">{t('pricing.month')}</span>
                  </div>

                  <ul className="space-y-3 pt-2">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-650 font-medium">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={orderingPlan !== null || (isUserCurrent && !isFree)}
                    className={`w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex justify-center items-center gap-1.5 ${
                      isUserCurrent
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 cursor-default font-black'
                        : plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {orderingPlan === plan.name ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>{t('pricing.ordering')}</span>
                      </>
                    ) : isUserCurrent ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>{t('pricing.active')}</span>
                      </>
                    ) : (
                      plan.cta
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Support disclaimer banner */}
        <div className="max-w-xl mx-auto p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100/70 text-center space-y-2">
          <h4 className="text-xs font-bold text-indigo-950 flex items-center justify-center gap-1">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>{t('pricing.secureTransactions')}</span>
          </h4>
          <p className="text-[10px] text-indigo-650 leading-relaxed font-semibold">
            {t('pricing.disclaimer')}
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} Onusandhan AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
