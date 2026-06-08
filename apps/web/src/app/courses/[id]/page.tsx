'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, CheckCircle, ChevronRight, Lock, Play, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

export default function CourseDetail() {
  const { id } = useParams() as { id: string };
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCourseDetails = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/${id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          setCourse(data.course);
        }
      } else {
        setError(language === 'bn' ? 'কোর্সের বিবরণ পুনরুদ্ধার করা যায়নি।' : 'Course details could not be retrieved.');
      }
    } catch (err) {
      setError(language === 'bn' ? 'একাডেমি ডাটাবেসের সাথে যোগাযোগ করতে ব্যর্থ হয়েছে।' : 'Failed to communicate with academy database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setEnrolling(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/${id}/enroll`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(language === 'bn' ? 'সফলভাবে নথিভুক্ত হয়েছেন! ক্লাসরুমে নিয়ে যাওয়া হচ্ছে...' : 'Enrolled successfully! Redirecting to classroom...');
        setTimeout(() => {
          fetchCourseDetails();
        }, 1500);
      } else {
        setError(data.message || (language === 'bn' ? 'নথিভুক্তি লেনদেন ব্যর্থ হয়েছে।' : 'Enrollment transaction failed.'));
      }
    } catch (err) {
      setError(language === 'bn' ? 'নথিভুক্তির সময় নেটওয়ার্ক ত্রুটি ঘটেছে।' : 'Network error during enrollment.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-slate-505 font-semibold">{language === 'bn' ? 'কোর্স পাওয়া যায়নি।' : 'Course not found.'}</p>
        <Link href="/courses" className="text-indigo-600 font-bold hover:underline">
          {language === 'bn' ? 'একাডেমি ক্যাটালগে ফিরে যান' : 'Return to Academy Catalog'}
        </Link>
      </div>
    );
  }

  // Find first lesson to deep link
  const firstLessonId = course.modules?.[0]?.lessons?.[0]?.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back to Catalog Link */}
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-650 transition-colors font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{language === 'bn' ? 'একাডেমি ক্যাটালগে ফিরে যান' : 'Back to Academy Catalog'}</span>
      </Link>

      {/* Hero Banner Section */}
      <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm grid md:grid-cols-3 gap-8 items-start relative overflow-hidden">
        <div className="md:col-span-2 space-y-4">
          <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-full tracking-wider uppercase inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>{language === 'bn' ? 'একাডেমিক পাঠ্যক্রম' : 'Academic Curriculum'}</span>
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">{course.title}</h1>
          <p className="text-sm text-slate-505 leading-relaxed">{course.description}</p>
        </div>

        {/* Enrollment Control Box */}
        <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-4 flex flex-col justify-between h-full">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{language === 'bn' ? 'টিউশন ফি' : 'Tuition Fees'}</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {course.price > 0 ? `$${course.price.toFixed(2)}` : (language === 'bn' ? 'বিনামূল্যে' : 'Free of Charge')}
            </div>
          </div>

          {error && <div className="text-xs text-red-650 font-semibold">{error}</div>}
          {success && <div className="text-xs text-emerald-700 font-semibold">{success}</div>}

          {course.isEnrolled ? (
            <div className="space-y-2">
              <div className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 justify-center py-1">
                <CheckCircle className="h-4.5 w-4.5" />
                <span>{language === 'bn' ? 'সক্রিয় ক্লাসরুম শিক্ষার্থী' : 'Active Classroom Student'}</span>
              </div>
              {firstLessonId ? (
                <Link
                  href={`/courses/${course.id}/lessons/${firstLessonId}`}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>{language === 'bn' ? 'পড়া শুরু করুন' : 'Start Studying'}</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 bg-slate-300 text-slate-500 rounded-xl text-xs font-bold transition-all cursor-not-allowed"
                >
                  {language === 'bn' ? 'পাঠ আপলোড পেন্ডিং' : 'Lessons Pending Upload'}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              {enrolling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{language === 'bn' ? 'প্রক্রিয়াকরণ হচ্ছে...' : 'Processing...'}</span>
                </>
              ) : (
                <span>{t('courses.enrollNow')}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Course Syllabus / Modules */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-650" />
          <span>{language === 'bn' ? 'কোর্সের সিলেবাস ও মডিউলসমূহ' : 'Course Syllabus & Modules'}</span>
        </h2>

        <div className="space-y-6">
          {course.modules?.map((mod: any) => (
            <div key={mod.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-black text-slate-600">
                    M{mod.orderIndex}
                  </span>
                  <span>{mod.title}</span>
                </h3>
                {mod.description && <p className="text-xs text-slate-400 mt-1 font-medium">{mod.description}</p>}
              </div>

              {/* Lessons list */}
              <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2 space-y-1">
                {mod.lessons?.map((lesson: any) => {
                  const isLocked = !course.isEnrolled;

                  const LessonContent = (
                    <div className="flex items-center justify-between p-3 rounded-xl transition-all select-none hover:bg-slate-50/50">
                      <div className="flex items-center gap-3">
                        {isLocked ? (
                          <Lock className="h-4 w-4 text-slate-350 shrink-0" />
                        ) : (
                          <div
                            className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center text-[10px] ${
                              lesson.completed
                                ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {lesson.completed && '✓'}
                          </div>
                        )}
                        <span className={`text-xs font-semibold ${isLocked ? 'text-slate-400' : 'text-slate-700'}`}>
                          {lesson.title}
                        </span>
                      </div>
                      {!isLocked && (
                        <span className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                          <span>{language === 'bn' ? 'পাঠ পড়ুন' : 'Study Lesson'}</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  );

                  return isLocked ? (
                    <div key={lesson.id} className="cursor-not-allowed">
                      {LessonContent}
                    </div>
                  ) : (
                    <Link key={lesson.id} href={`/courses/${course.id}/lessons/${lesson.id}`}>
                      {LessonContent}
                    </Link>
                  );
                })}

                {mod.lessons?.length === 0 && (
                  <div className="text-xs text-slate-400 py-3 italic">
                    {language === 'bn' ? 'এই মডিউলে এখনও কোনো পাঠ যোগ করা হয়নি।' : 'No lessons have been added to this module yet.'}
                  </div>
                )}
              </div>
            </div>
          ))}

          {course.modules?.length === 0 && (
            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400">
              {language === 'bn' ? 'সিলেবাস বর্তমানে খালি আছে। প্রশাসনিক মডিউল সংযোজন করা হচ্ছে।' : 'Syllabus is currently empty. Administrative modules are being assembled.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
