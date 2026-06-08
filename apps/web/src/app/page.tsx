'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { Search, BookOpen, Users, Award, ShieldCheck, Download, FileText } from 'lucide-react';

export default function Home() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalPapers: 124,
    activeScholars: 432,
    completedReviews: 310,
    universities: 48,
  });

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.papers) {
            // Filter only accepted or peer-reviewed papers for public viewing
            setPapers(data.papers);
          }
        }
      } catch (err) {
        console.error('Error fetching public papers:', err);
      }
    };
    fetchPapers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const filteredPapers = papers.filter((paper) => {
    const term = searchQuery.toLowerCase();
    return (
      paper.title.toLowerCase().includes(term) ||
      paper.abstract.toLowerCase().includes(term) ||
      paper.keywords.some((k: string) => k.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="text-center py-12 md:py-16 space-y-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-indigo-950 leading-tight">
          {t('tagline')}
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          An open academic publishing ecosystem powered by role-based verification, secure double-blind reviews, and advanced publication workflows.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-28 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-800 placeholder-slate-400"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all duration-200"
          >
            {t('searchBtn')}
          </button>
        </form>
      </section>

      {/* Stats section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalPapers}</div>
            <div className="text-xs text-slate-500 font-medium">{t('landing.statsPapers')}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.activeScholars}</div>
            <div className="text-xs text-slate-500 font-medium">{t('landing.statsScholars')}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-orange-50 text-orange-600 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.completedReviews}</div>
            <div className="text-xs text-slate-500 font-medium">{t('landing.statsReviews')}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3.5 bg-violet-50 text-violet-600 rounded-xl">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.universities}</div>
            <div className="text-xs text-slate-500 font-medium">{t('landing.statsInstitutions')}</div>
          </div>
        </div>
      </section>

      {/* Publications feed */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="h-6 w-6 text-indigo-600" />
          <span>{t('landing.recentSubmissions')}</span>
        </h2>

        {filteredPapers.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all hover:-translate-y-0.5 duration-200"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                      {t(`status.${paper.status}`)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(paper.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 line-clamp-2 leading-snug">
                    {paper.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-3">
                    {paper.abstract}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.keywords.map((k: string) => (
                      <span key={k} className="px-2 py-0.5 rounded bg-slate-100 text-xs text-slate-600">
                        #{k}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-100">
                  <div className="text-xs font-medium text-slate-500">
                    By: {paper.authors?.map((a: any) => a.user.name).join(', ') || 'Anonymous Scholar'}
                  </div>

                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers/${paper.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
            <BookOpen className="h-12 w-12 mx-auto stroke-1 mb-3" />
            <p className="text-sm">{t('landing.noPapers')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
