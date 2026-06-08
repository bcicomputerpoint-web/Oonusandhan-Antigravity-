'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, CheckCircle, ChevronLeft, ArrowLeft, Play, Save, CheckCircle2 } from 'lucide-react';

export default function LessonWorkspace() {
  const { id: courseId, lessonId } = useParams() as { id: string; lessonId: string };
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<any | null>(null);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Authenticate user check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const fetchWorkspaceData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/${courseId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          setCourse(data.course);

          // Find active lesson from syllabus
          let foundLesson = null;
          let totalLessons = 0;
          let completedLessons = 0;

          for (const mod of data.course.modules || []) {
            for (const les of mod.lessons || []) {
              totalLessons++;
              if (les.completed) {
                completedLessons++;
              }
              if (les.id === lessonId) {
                foundLesson = les;
              }
            }
          }

          if (foundLesson) {
            setActiveLesson(foundLesson);
            // Load saved notes from LocalStorage
            const storedNotes = localStorage.getItem(`onusandhan_notes_${user?.id}_${lessonId}`);
            setNotes(storedNotes || '');
          }

          // Calculate progress percentage
          if (totalLessons > 0) {
            setProgressPercent(Math.round((completedLessons / totalLessons) * 100));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkspaceData();
    }
  }, [courseId, lessonId, user]);

  // Handle progress toggle
  const handleToggleComplete = async () => {
    if (!activeLesson) return;

    const newCompletedState = !activeLesson.completed;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newCompletedState }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        // Optimistically update locally
        setActiveLesson({
          ...activeLesson,
          completed: newCompletedState,
        });
        fetchWorkspaceData();
      }
    } catch (err) {
      console.error('Error toggling progress:', err);
    }
  };

  // Handle auto-saving notes locally
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNotes(text);
    if (user) {
      localStorage.setItem(`onusandhan_notes_${user.id}_${lessonId}`, text);
      setSaveMessage(t('courses.savingNotes'));
      setTimeout(() => {
        setSaveMessage('');
      }, 1500);
    }
  };

  // Helper to parse YouTube video embeds
  const renderVideo = (videoUrl: string | null) => {
    if (!videoUrl) {
      return (
        <div className="bg-slate-900 aspect-video rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 text-center select-none shadow-inner border border-slate-800">
          <Play className="h-12 w-12 text-slate-600 stroke-1 mb-2 animate-pulse" />
          <h4 className="text-sm font-bold text-slate-350">{language === 'bn' ? 'একাডেমিক ভিজ্যুয়ালাইজার এবং অডিও লেকচার' : 'Academic Visualizer & Audio Lecture'}</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">{language === 'bn' ? 'এই মডিউলে কোনো ভিডিও লেকচার সংযুক্ত নেই। নিচে মূল রূপরেখা ও নোটে মনোযোগ দিন।' : 'No video lecture attached to this module. Focus on the core synopsis outline and resources notes below.'}</p>
        </div>
      );
    }

    // Check YouTube match
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const ytMatch = videoUrl.match(ytRegex);

    if (ytMatch && ytMatch[1]) {
      const embedId = ytMatch[1];
      return (
        <div className="aspect-video rounded-2xl overflow-hidden shadow-md border border-slate-200">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${embedId}`}
            title="Lesson Lecture video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Fallback normal link or mock player
    return (
      <div className="bg-slate-900 aspect-video rounded-2xl flex flex-col items-center justify-center text-slate-400 p-6 text-center shadow-inner border border-slate-800 relative">
        <video
          className="w-full h-full rounded-2xl object-cover absolute opacity-30 pointer-events-none"
          src={videoUrl}
          muted
          loop
          autoPlay
        />
        <div className="relative z-10 space-y-2 select-none">
          <Play className="h-10 w-10 text-indigo-500 mx-auto fill-indigo-500" />
          <h4 className="text-sm font-bold text-white">{language === 'bn' ? 'মিডিয়া সম্পদ সংযুক্ত করা হয়েছে' : 'Media Asset Connected'}</h4>
          <a
            href={videoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:underline inline-block font-semibold"
          >
            {language === 'bn' ? 'ট্যাবে মিডিয়া লিঙ্কটি চালু করুন' : 'Launch Media Link in Tab'}
          </a>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="py-16 flex justify-center items-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!course || !activeLesson) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <p className="text-slate-505 font-semibold">{language === 'bn' ? 'ওয়ার্কস্পেস সম্পদ লোড করা যায়নি।' : 'Workspace assets could not be loaded.'}</p>
        <Link href="/courses" className="text-indigo-600 font-bold hover:underline">
          {language === 'bn' ? 'কোর্স ক্যাটালগে ফিরে যান' : 'Return to Course Catalog'}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full min-h-[80vh]">
      {/* LEFT COLUMN: MODULES INDEX (SYLLABUS SIDEBAR) */}
      <aside className="w-full lg:w-80 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm shrink-0 space-y-6 lg:sticky lg:top-20 max-h-[85vh] overflow-y-auto">
        <div className="space-y-1">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-650 transition-colors uppercase tracking-wider"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{language === 'bn' ? 'সিলেবাস ওভারভিউ' : 'Syllabus Overview'}</span>
          </Link>
          <h2 className="text-base font-extrabold text-slate-900 line-clamp-2 mt-1">{course.title}</h2>
        </div>

        {/* Progress Tracker Widget */}
        <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-indigo-700 uppercase">
            <span>{language === 'bn' ? 'কোর্স অগ্রগতি' : 'Course Progress'}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-550"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Modules Syllabus Checklist */}
        <div className="space-y-5">
          {course.modules?.map((mod: any) => (
            <div key={mod.id} className="space-y-2">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                {language === 'bn' ? 'মডিউল' : 'Module'} {mod.orderIndex}: {mod.title}
              </h4>
              <div className="space-y-1 pl-1">
                {mod.lessons?.map((les: any) => {
                  const isCurrent = les.id === lessonId;
                  return (
                    <Link
                      key={les.id}
                      href={`/courses/${courseId}/lessons/${les.id}`}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all text-xs font-bold ${
                        isCurrent
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center text-[9px] shrink-0 ${
                            isCurrent
                              ? les.completed
                                ? 'bg-white text-indigo-600 border-white font-extrabold'
                                : 'border-indigo-300 bg-indigo-750 text-indigo-300'
                              : les.completed
                              ? 'bg-indigo-600 border-indigo-600 text-white font-extrabold'
                              : 'border-slate-355 bg-white text-slate-300'
                          }`}
                        >
                          {les.completed && '✓'}
                        </div>
                        <span className="truncate pr-1">{les.title}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* RIGHT COLUMN: MAIN WORKSPACE */}
      <main className="flex-1 w-full space-y-6">
        {/* Video Player Container */}
        {renderVideo(activeLesson.videoUrl)}

        {/* Lesson Metadata & Completed State Controls */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-black text-slate-500 uppercase">
                {language === 'bn' ? 'সক্রিয় পাঠ' : 'Active Lesson'}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 mt-1">{activeLesson.title}</h1>
            </div>
            
            <button
              onClick={handleToggleComplete}
              className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 ${
                activeLesson.completed
                  ? 'bg-emerald-50 border border-emerald-150 hover:bg-emerald-100 text-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-755 text-white'
              }`}
            >
              <CheckCircle2 className="h-4.5 w-4.5" />
              <span>{activeLesson.completed ? (language === 'bn' ? 'পাঠ সম্পন্ন ✓' : 'Lesson Completed ✓') : (language === 'bn' ? 'সম্পন্ন হিসেবে চিহ্নিত করুন' : 'Mark as Complete')}</span>
            </button>
          </div>

          {/* Lesson Rich Content View */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">{language === 'bn' ? 'পাঠের উপকরণ ও সারসংক্ষেপ' : 'Lesson Materials & Synopsis'}</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
              {activeLesson.content}
            </p>
          </div>
        </div>

        {/* Study Notes Auto-saving Widget */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Save className="h-4.5 w-4.5 text-indigo-600" />
              <h3 className="text-sm font-black text-slate-955 uppercase tracking-wider">{t('courses.lessonNotes')}</h3>
            </div>
            {saveMessage && <span className="text-[10px] text-indigo-600 font-bold animate-pulse">{saveMessage}</span>}
          </div>
          
          <textarea
            rows={5}
            value={notes}
            onChange={handleNotesChange}
            placeholder={t('courses.notesPlaceholder')}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-xs resize-none text-slate-800 leading-relaxed font-medium"
          />
        </div>
      </main>
    </div>
  );
}
