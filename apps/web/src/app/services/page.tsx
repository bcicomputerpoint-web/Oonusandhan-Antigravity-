'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { BookOpen, HelpCircle, ArrowRight, ShieldCheck, Cpu, Star, ExternalLink } from 'lucide-react';

interface ServiceWing {
  id: string;
  name: string;
  description: string;
  priceRate: number;
}

// Fallback/Default seeded wings list in case server is loading or offline
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

export default function ServicesCatalogPage() {
  const { t, language } = useLanguage();
  const [wings, setWings] = useState<ServiceWing[]>(DEFAULT_WINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWings = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/wings`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.wings && data.wings.length > 0) {
            setWings(data.wings);
          }
        }
      } catch (err) {
        console.error('Failed to fetch service wings, using local defaults', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWings();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Top */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="text-xl font-black text-indigo-950 flex items-center gap-2">
            <Cpu className="h-6 w-6 text-indigo-600" />
            <span>Onusandhan AI</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/services" className="text-sm font-bold text-indigo-650 hover:text-indigo-800">
              {language === 'bn' ? 'সার্ভিসসমূহ' : 'Services'}
            </Link>
            <Link href="/dashboard" className="text-sm font-bold text-slate-650 hover:text-indigo-650">
              {t('dashboard')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 py-20 px-6 text-white text-center shadow-xl shadow-indigo-950/10">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider text-indigo-200 uppercase">
            {language === 'bn' ? 'একাডেমিক সহায়তা কেন্দ্র' : 'Academic Support Center'}
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            {t('services.title')}
          </h1>
          <p className="text-indigo-200 text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>
      </div>

      {/* Wings Grid */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wings.map((wing) => {
            const wingName = t(`services.wings.${wing.id}.name`);
            const wingDesc = t(`services.wings.${wing.id}.desc`);
            const name = wingName.includes('services.wings') ? wing.name : wingName;
            const description = wingDesc.includes('services.wings') ? wing.description : wingDesc;

            return (
              <div
                key={wing.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-350 transition-all hover:-translate-y-1 duration-300 relative group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <BookOpen className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                    </div>
                    <span className="text-xs font-extrabold text-indigo-600 bg-indigo-55/10 px-2.5 py-1 rounded-lg">
                      {t('services.priceRate')}: ${wing.priceRate}{t('services.perHour')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight group-hover:text-indigo-650 transition-colors">
                      {name}
                    </h3>
                    <p className="text-xs text-slate-505 leading-relaxed min-h-[60px]">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>{language === 'bn' ? 'যাচাইকৃত সেবা' : 'Verified Service'}</span>
                  </span>
                  
                  {/* Details Link */}
                  <Link
                    href={`/services/${wing.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-850 group-hover:underline"
                  >
                    <span>{language === 'bn' ? 'অনুরোধ করুন' : 'Request Support'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
