'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Award, FileText, Download, Star, CheckCircle, AlertCircle } from 'lucide-react';

export default function FacultyDashboard() {
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

  // Review form states
  const [score, setScore] = useState(4);
  const [comments, setComments] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [status, setStatus] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reviews/my-assignments`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.assignments) {
          setAssignments(data.assignments);
        }
      }
    } catch (err) {
      console.error('Error fetching reviewer assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (!selectedPaper) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: selectedPaper.id,
          score,
          comments,
          recommendations,
          status,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(t('facultyDash.reviewSuccess'));
        setComments('');
        setRecommendations('');
        setSelectedPaper(null);
        fetchAssignments();
      } else {
        setError(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      setError('Connection error submitting peer review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8">
      {/* Left Column: Review Assignments */}
      <div className="lg:col-span-7 space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Award className="h-6 w-6 text-indigo-600" />
          <span>{t('facultyDash.assignments')}</span>
        </h2>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : assignments.length > 0 ? (
          <div className="space-y-4">
            {assignments.map((assign) => (
              <div
                key={assign.id}
                onClick={() => {
                  if (assign.status === 'PENDING') {
                    setSelectedPaper(assign.paper);
                    setError('');
                    setSuccess('');
                  }
                }}
                className={`bg-white p-6 rounded-3xl border shadow-sm flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer ${
                  selectedPaper?.id === assign.paper.id
                    ? 'border-indigo-500 ring-2 ring-indigo-50'
                    : 'border-slate-200 hover:shadow-md'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        assign.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {assign.status === 'PENDING' ? 'Pending Action' : 'Completed Review'}
                    </span>
                    <span className="text-xs text-slate-400">
                      Assigned: {new Date(assign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-950 leading-snug">{assign.paper.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{assign.paper.abstract}</p>
                </div>

                <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-400">
                    Authors: Double-blind review (Hidden)
                  </div>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers/${assign.paper.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()} // Stop selection toggle
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Manuscript</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
            <Award className="h-12 w-12 mx-auto stroke-1 mb-3" />
            <p className="text-sm">{t('facultyDash.noAssignments')}</p>
          </div>
        )}
      </div>

      {/* Right Column: Active Review Form */}
      <div className="lg:col-span-5 space-y-6">
        {selectedPaper ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>Evaluate Manuscript</span>
            </h2>
            <div className="p-3 bg-slate-50 rounded-xl">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Evaluating Paper</h3>
              <p className="text-sm font-semibold text-slate-800 line-clamp-2">{selectedPaper.title}</p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <span>{t('facultyDash.score')}</span>
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        onClick={() => setScore(s)}
                        className={`h-4 w-4 cursor-pointer ${s <= score ? 'fill-current' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                </label>
                <select
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-800"
                >
                  <option value={5}>5 - Outstanding research contribution</option>
                  <option value={4}>4 - High-quality manuscript</option>
                  <option value={3}>3 - Acceptable with improvements</option>
                  <option value={2}>2 - Marginal quality</option>
                  <option value={1}>1 - Reject contribution</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('facultyDash.comments')}</label>
                <textarea
                  required
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  placeholder="Provide structured feedback..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('facultyDash.recommendation')}</label>
                <textarea
                  required
                  rows={2}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                  placeholder="Detailed suggestions..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Decision</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setStatus('ACCEPTED')}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                      status === 'ACCEPTED'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {t('facultyDash.recommendAccept')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('REJECTED')}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                      status === 'REJECTED'
                        ? 'border-red-600 bg-red-50 text-red-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {t('facultyDash.recommendReject')}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-md transition-all text-sm"
              >
                {submitting ? 'Recording Evaluation...' : t('facultyDash.submitReview')}
              </button>
            </form>
          </div>
        ) : (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-6 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400">
            <Award className="h-10 w-10 mb-2 stroke-1 text-slate-300" />
            <p className="text-sm font-medium">Select a pending manuscript to write review reports.</p>
          </div>
        )}
      </div>
    </div>
  );
}
