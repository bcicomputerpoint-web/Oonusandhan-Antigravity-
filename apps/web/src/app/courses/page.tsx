'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Award, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';

export default function CoursesCatalog() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.courses) {
          setCourses(data.courses);
        }
      }
    } catch (err) {
      console.error('Error retrieving courses list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Navigation breadcrumb */}
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-650 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('courses.backToHome')}</span>
        </Link>
        {user && (
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-sm"
          >
            {t('courses.goToScholarDesk')}
          </Link>
        )}
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 md:p-12 rounded-3xl text-white shadow-xl space-y-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-600/30 via-transparent to-transparent pointer-events-none" />
        <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider text-indigo-200 uppercase">
          {t('courses.academicAcademy')}
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{t('courses.classroomTitle')}</h1>
        <p className="text-indigo-100 text-sm md:text-base max-w-xl font-medium leading-relaxed">
          {t('courses.classroomSubtitle')}
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid md:grid-cols-2 gap-8 pt-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative overflow-hidden"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <BookOpen className="h-6 w-6" />
                </div>
                {course.isEnrolled ? (
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs font-extrabold rounded-full flex items-center gap-1 shadow-sm">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>{t('courses.enrolled')}</span>
                  </span>
                ) : (
                  <span className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1 border border-slate-200 rounded-full">
                    {course.price > 0 ? `$${course.price.toFixed(2)}` : t('courses.free')}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-650 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-505 leading-relaxed line-clamp-3">
                  {course.description}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 mt-6 flex justify-between items-center gap-4">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider">
                {course.modulesCount || 0} {t('courses.modulesSyllabus')}
              </span>
              <Link
                href={`/courses/${course.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>{course.isEnrolled ? t('courses.openClassroom') : t('courses.exploreSyllabus')}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-2 text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-slate-400">
            <Award className="h-12 w-12 mx-auto stroke-1 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">{t('courses.noCourses')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
