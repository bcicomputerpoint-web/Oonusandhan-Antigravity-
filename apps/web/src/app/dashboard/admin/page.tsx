'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  BookOpen, 
  Users, 
  History, 
  Check, 
  AlertCircle, 
  FileSpreadsheet, 
  Sparkles, 
  ChevronLeft, 
  Lock, 
  Unlock, 
  Trash2, 
  FolderOpen, 
  MessageSquare, 
  AlertTriangle,
  CreditCard
} from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'stats' | 'papers' | 'users' | 'logs' | 'services' | 'courses' | 'tickets' | 'payments'>('stats');

  // Backend data states
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalPapers: 0,
    totalReviews: 0,
    pendingReviews: 0,
    activeServiceRequests: 0,
    totalEnrollments: 0,
    totalTokens: 0,
    totalAiCalls: 0,
    recentUploads: [],
    recentSupportTickets: [],
  });
  const [papers, setPapers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [aiStats, setAiStats] = useState<any>(null);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [adminCourses, setAdminCourses] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<any>({
    totalRevenue: 0,
    successRate: 100,
    activeSubscribersCount: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  // Security redirect for non-admins
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'INSTITUTION_ADMIN') {
        router.push('/dashboard');
      }
    }
  }, [user, authLoading, router]);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionLabel: '',
    onConfirm: () => {},
  });

  const triggerConfirm = (title: string, message: string, actionLabel: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      actionLabel,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Drill-down admin course builder states
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [coursePrice, setCoursePrice] = useState(0);

  // Module form states
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');

  // Lesson form states
  const [addingLessonModId, setAddingLessonModId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonVideo, setLessonVideo] = useState('');

  // Assignment states
  const [assigningPaper, setAssigningPaper] = useState<any | null>(null);
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignError, setAssignError] = useState('');

  // Role modification states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/dashboard-stats`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  };

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.papers) setPapers(data.papers);
      }
    } catch (err) {
      console.error('Error fetching admin papers:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.users) setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/audit-logs`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logs) setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchAiUsage = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/usage`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAiStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching AI usage stats:', err);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/requests`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.requests) setServiceRequests(data.requests);
      }
    } catch (err) {
      console.error('Error fetching admin service requests:', err);
    }
  };

  const handleUpdateServiceStatus = async (requestId: string, newStatus: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/requests/${requestId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        fetchServiceRequests();
        fetchLogs();
      } else {
        alert(data.message || 'Failed to update service request status.');
      }
    } catch (err) {
      alert('Error updating service request status.');
    }
  };

  const fetchAdminCourses = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.courses) {
          setAdminCourses(data.courses);
        }
      }
    } catch (err) {
      console.error('Error fetching admin courses:', err);
    }
  };

  const fetchSelectedCourseDetail = async (courseId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/${courseId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.course) {
          setSelectedCourse(data.course);
        }
      }
    } catch (err) {
      console.error('Error fetching admin course detail:', err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle || !courseDesc) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDesc,
          price: Number(coursePrice),
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setCreatingCourse(false);
        setCourseTitle('');
        setCourseDesc('');
        setCoursePrice(0);
        fetchAdminCourses();
      } else {
        alert(data.message || 'Failed to create course');
      }
    } catch (err) {
      alert('Error creating course');
    }
  };

  const handleTogglePublish = async (courseId: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentPublished }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        fetchAdminCourses();
        if (selectedCourse?.id === courseId) {
          fetchSelectedCourseDetail(courseId);
        }
      } else {
        alert(data.message || 'Failed to toggle publish status');
      }
    } catch (err) {
      alert('Error toggling publish status');
    }
  };

  const handleDeleteCourse = (courseId: string) => {
    triggerConfirm(
      'Delete Course permanently?',
      'Are you sure you want to delete this course? This will remove all modules and lessons inside, and cancel student enrollments.',
      'Delete Course',
      async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/${courseId}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          const data = await res.json();
          if (data.success) {
            if (selectedCourse?.id === courseId) {
              setSelectedCourse(null);
            }
            fetchAdminCourses();
            fetchStats();
            fetchLogs();
          } else {
            alert(data.message || 'Failed to delete course');
          }
        } catch (err) {
          alert('Error deleting course');
        }
      }
    );
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !moduleTitle) return;

    const currentModulesCount = selectedCourse.modules?.length || 0;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/${selectedCourse.id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: moduleTitle,
          description: moduleDesc || undefined,
          orderIndex: currentModulesCount + 1,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setModuleTitle('');
        setModuleDesc('');
        fetchSelectedCourseDetail(selectedCourse.id);
        fetchAdminCourses();
      } else {
        alert(data.message || 'Failed to create module');
      }
    } catch (err) {
      alert('Error creating module');
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    triggerConfirm(
      'Delete Module?',
      'Are you sure you want to delete this module and all lessons inside?',
      'Delete Module',
      async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/modules/${moduleId}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          const data = await res.json();
          if (data.success) {
            if (selectedCourse) {
              fetchSelectedCourseDetail(selectedCourse.id);
            }
            fetchAdminCourses();
            fetchLogs();
          } else {
            alert(data.message || 'Failed to delete module');
          }
        } catch (err) {
          alert('Error deleting module');
        }
      }
    );
  };

  const handleCreateLesson = async (moduleId: string) => {
    if (!lessonTitle || !lessonContent) return;

    const mod = selectedCourse.modules?.find((m: any) => m.id === moduleId);
    const currentLessonsCount = mod?.lessons?.length || 0;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle,
          content: lessonContent,
          videoUrl: lessonVideo || null,
          orderIndex: currentLessonsCount + 1,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setLessonTitle('');
        setLessonContent('');
        setLessonVideo('');
        setAddingLessonModId(null);
        if (selectedCourse) {
          fetchSelectedCourseDetail(selectedCourse.id);
        }
        fetchAdminCourses();
      } else {
        alert(data.message || 'Failed to create lesson');
      }
    } catch (err) {
      alert('Error creating lesson');
    }
  };

  const handleUpdateLesson = async (lessonId: string) => {
    if (!lessonTitle || !lessonContent) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle,
          content: lessonContent,
          videoUrl: lessonVideo || null,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setLessonTitle('');
        setLessonContent('');
        setLessonVideo('');
        setEditingLesson(null);
        if (selectedCourse) {
          fetchSelectedCourseDetail(selectedCourse.id);
        }
        fetchAdminCourses();
      } else {
        alert(data.message || 'Failed to update lesson');
      }
    } catch (err) {
      alert('Error updating lesson');
    }
  };

  const handleDeleteLesson = (lessonId: string) => {
    triggerConfirm(
      'Delete Lesson?',
      'Are you sure you want to permanently delete this lesson?',
      'Delete Lesson',
      async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/lessons/${lessonId}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          const data = await res.json();
          if (data.success) {
            if (selectedCourse) {
              fetchSelectedCourseDetail(selectedCourse.id);
            }
            fetchAdminCourses();
            fetchLogs();
          } else {
            alert(data.message || 'Failed to delete lesson');
          }
        } catch (err) {
          alert('Error deleting lesson');
        }
      }
    );
  };

  const handleReorderLesson = async (lessonId: string, direction: 'up' | 'down') => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/lessons/${lessonId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        if (selectedCourse) {
          fetchSelectedCourseDetail(selectedCourse.id);
        }
      } else {
        alert(data.message || 'Failed to reorder lessons');
      }
    } catch (err) {
      alert('Error reordering lessons');
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/support-tickets`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.tickets) setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Error fetching admin support tickets:', err);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/support-tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        fetchSupportTickets();
        fetchStats();
        fetchLogs();
      } else {
        alert(data.message || 'Failed to update ticket status');
      }
    } catch (err) {
      alert('Error updating support ticket status');
    }
  };

  const handleToggleLockUser = async (targetUserId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users/${targetUserId}/lock`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
        fetchLogs();
      } else {
        alert(data.message || 'Failed to toggle user lock state');
      }
    } catch (err) {
      alert('Error toggling user lock state');
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users/${targetUserId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
        fetchStats();
        fetchLogs();
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('Error deleting user');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        fetchPapers();
        fetchStats();
        fetchLogs();
      } else {
        alert(data.message || 'Failed to delete document');
      }
    } catch (err) {
      alert('Error deleting document');
    }
  };

  const fetchPaymentsOverview = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/payments/admin/overview`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPayments(data.payments || []);
          if (data.stats) setFinancialStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching admin payments overview:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchPapers(),
      fetchUsers(),
      fetchLogs(),
      fetchAiUsage(),
      fetchServiceRequests(),
      fetchAdminCourses(),
      fetchSupportTickets(),
      fetchPaymentsOverview()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'INSTITUTION_ADMIN')) {
      loadAllData();
    }
  }, [user]);

  const handleAssignReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignSuccess('');
    setAssignError('');

    if (!selectedReviewerId || !assigningPaper) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/reviews/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paperId: assigningPaper.id,
          reviewerId: selectedReviewerId,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setAssignSuccess('Reviewer assigned and notified successfully!');
        setSelectedReviewerId('');
        setAssigningPaper(null);
        fetchPapers();
        fetchStats();
      } else {
        setAssignError(data.message || 'Assignment failed.');
      }
    } catch (err) {
      setAssignError('Network error assigning reviewer.');
    }
  };

  const handleUpdateRole = async (targetUserId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/admin/users/${targetUserId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: editingRole }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setEditingUserId(null);
        fetchUsers();
        fetchLogs();
      } else {
        alert(data.message || 'Failed to update role.');
      }
    } catch (err) {
      alert('Error updating user role.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'INSTITUTION_ADMIN')) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-indigo-600" />
            <span>{t('adminDash.title')}</span>
          </h1>
          <p className="text-slate-500 text-sm">System oversight, role assignment, and blind reviewer allocations.</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {(['stats', 'papers', 'users', 'logs', 'services', 'courses', 'tickets', 'payments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'services' ? 'Services' : tab === 'courses' ? 'Courses' : tab === 'tickets' ? 'Tickets' : tab === 'payments' ? 'Payments' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">{t('adminDash.stats')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">System Users</div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalUsers}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Documents</div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalPapers}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Requests</div>
              <div className="text-2xl font-extrabold text-indigo-600">{stats.activeServiceRequests ?? 0}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Course Enrollments</div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalEnrollments ?? 0}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">AI Usage Runs</div>
              <div className="text-2xl font-extrabold text-slate-900">{stats.totalAiCalls ?? 0}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">AI Tokens Used</div>
              <div className="text-2xl font-extrabold text-slate-900">{(stats.totalTokens ?? 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Two Column Grid for Uploads & Tickets */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Uploads */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-905 flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4 text-indigo-600" />
                  <span>Recent Document Uploads</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.recentUploads && stats.recentUploads.length > 0 ? (
                  stats.recentUploads.map((doc: any) => (
                    <div key={doc.id} className="py-3 flex justify-between items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">{doc.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Category: <span className="font-semibold">{doc.category}</span> • Author: {doc.author?.name}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-450 shrink-0 font-medium">{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">No recent uploads found.</div>
                )}
              </div>
            </div>

            {/* Recent Support Tickets */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-905 flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-600" />
                  <span>Recent Support Tickets</span>
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.recentSupportTickets && stats.recentSupportTickets.length > 0 ? (
                  stats.recentSupportTickets.map((ticket: any) => (
                    <div key={ticket.id} className="py-3 flex justify-between items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate">{ticket.subject}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Status: <span className={`font-black uppercase ${ticket.status === 'OPEN' ? 'text-rose-600' : 'text-slate-500'}`}>{ticket.status}</span> • User: {ticket.user?.name}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-450 shrink-0 font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">No recent tickets found.</div>
                )}
              </div>
            </div>
          </div>

          {/* AI Diagnostics Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 mt-8">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">AI Gateway Diagnostics</h3>
                <p className="text-xs text-slate-500">Track and monitor estimated token consumption, rate requests, and tool utility rankings.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total AI Computations</div>
                <div className="text-2xl font-extrabold text-slate-800">{aiStats?.totalCalls ?? 0} runs</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Tokens Consumed</div>
                <div className="text-2xl font-extrabold text-slate-800">{aiStats?.totalTokens?.toLocaleString() ?? 0} tokens</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Tokens / Run</div>
                <div className="text-2xl font-extrabold text-slate-800">
                  {aiStats?.totalCalls ? Math.round(aiStats.totalTokens / aiStats.totalCalls) : 0}
                </div>
              </div>
            </div>

            {/* Tool Breakdown Chart Bars */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Usage Breakdown by Tool</h4>
              {aiStats?.toolBreakdown && Object.keys(aiStats.toolBreakdown).length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(aiStats.toolBreakdown).map(([tool, count]) => {
                    const total = aiStats.totalCalls || 1;
                    const pct = Math.round(((count as number) / total) * 100);
                    return (
                      <div key={tool} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="capitalize">{tool.replace('-', ' ')}</span>
                          <span>{count as number} runs ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  No AI gateway transactions logged in the audit trail yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'papers' && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Papers Table */}
          <div className={`${assigningPaper ? 'lg:col-span-8' : 'lg:col-span-12'} bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-4">Manuscript Title</th>
                    <th className="p-4">Authors</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {papers.map((paper) => (
                    <tr key={paper.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-semibold text-slate-900 max-w-sm truncate">{paper.title}</td>
                      <td className="p-4 text-slate-500">
                        {paper.authors?.map((a: any) => a.user.name).join(', ') || 'Unknown'}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {t(`status.${paper.status}`)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => {
                              setAssigningPaper(paper);
                              setAssignSuccess('');
                              setAssignError('');
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all"
                          >
                            Assign Reviewer
                          </button>
                          <button
                            onClick={() => {
                              triggerConfirm(
                                'Delete Document permanently?',
                                `Are you sure you want to permanently delete document "${paper.title}"? This will delete the database record and remove the file from storage.`,
                                'Delete Document',
                                () => handleDeleteDocument(paper.id)
                              );
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-150 transition-all"
                            title="Delete Document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allocation drawer/box */}
          {assigningPaper && (
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Assign Peer Reviewer</h3>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-400 font-bold uppercase mb-1">Paper</div>
                <div className="text-sm font-semibold text-slate-800 line-clamp-2">{assigningPaper.title}</div>
              </div>

              {assignSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-xs text-emerald-700 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>{assignSuccess}</span>
                </div>
              )}

              {assignError && (
                <div className="p-3 rounded-lg bg-red-50 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{assignError}</span>
                </div>
              )}

              <form onSubmit={handleAssignReviewer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Select Faculty Member</label>
                  <select
                    required
                    value={selectedReviewerId}
                    onChange={(e) => setSelectedReviewerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm text-slate-800"
                  >
                    <option value="">-- Choose Reviewer --</option>
                    {users
                      .filter((u) => u.role === 'FACULTY')
                      .map((reviewer) => (
                        <option key={reviewer.id} value={reviewer.id}>
                          {reviewer.name} ({reviewer.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Confirm Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssigningPaper(null)}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Institution</th>
                  <th className="p-4">Role</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4 text-slate-500">{u.institution?.name || 'N/A'}</td>
                    <td className="p-4">
                      {editingUserId === u.id ? (
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                        >
                          <option value="SCHOLAR">SCHOLAR</option>
                          <option value="AUTHOR">AUTHOR</option>
                          <option value="FACULTY">FACULTY</option>
                          <option value="INSTITUTION_ADMIN">INSTITUTION_ADMIN</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {editingUserId === u.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleUpdateRole(u.id)}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end items-center gap-2">
                          {/* Lock/Unlock Button */}
                          {user?.id !== u.id && (
                            <button
                              onClick={() => {
                                const actionText = u.isLocked ? 'Unlock' : 'Lock';
                                triggerConfirm(
                                  `${actionText} User Account?`,
                                  `Are you sure you want to ${actionText.toLowerCase()} access for ${u.name} (${u.email})? Locked users cannot log in.`,
                                  `Confirm ${actionText}`,
                                  () => handleToggleLockUser(u.id)
                                );
                              }}
                              className={`p-1.5 rounded-lg border transition-all ${
                                u.isLocked
                                  ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                              }`}
                              title={u.isLocked ? 'Unlock Account' : 'Lock Account'}
                            >
                              {u.isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            </button>
                          )}

                          {/* Modify Role Button */}
                          {user?.role === 'SUPER_ADMIN' && (
                            <button
                              onClick={() => {
                                setEditingUserId(u.id);
                                setEditingRole(u.role);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-200"
                            >
                              Modify Role
                            </button>
                          )}

                          {/* Delete Button */}
                          {user?.role === 'SUPER_ADMIN' && user?.id !== u.id && (
                            <button
                              onClick={() => {
                                triggerConfirm(
                                  'Delete User Account permanently?',
                                  `Are you sure you want to permanently delete user account ${u.name} (${u.email})? This action cascades and is irreversible.`,
                                  'Delete Account',
                                  () => handleDeleteUser(u.id)
                                );
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg transition-all"
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-medium text-slate-900">{log.user?.name || 'Guest'} ({log.user?.email || 'N/A'})</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-semibold uppercase text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-xs max-w-sm truncate">{log.details}</td>
                    <td className="p-4 text-xs text-slate-400">{log.ipAddress || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Scholar Service Requests</h3>
              <p className="text-xs text-slate-505">View and manage service requests from scholars seeking thesis, proposal, or publication support.</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-bold rounded-full">
              {serviceRequests.length} Total Requests
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-4">Scholar</th>
                  <th className="p-4">Service Wing Requested</th>
                  <th className="p-4">Details / Requirements</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Submission Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {serviceRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{req.user?.name || 'Unknown Scholar'}</div>
                      <div className="text-xs text-slate-400">{req.user?.email || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{req.wing?.name || 'Academic Support'}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Rate: ${req.wing?.priceRate || 0}/hr</div>
                    </td>
                    <td className="p-4 max-w-sm">
                      <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-[80px] overflow-y-auto whitespace-pre-line">
                        {req.details}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                          req.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : req.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : req.status === 'IN_PROGRESS'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : req.status === 'ASSIGNED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : req.status === 'IN_REVIEW'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={req.status}
                        onChange={(e) => handleUpdateServiceStatus(req.id, e.target.value)}
                        className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer"
                      >
                        <option value="NEW">NEW</option>
                        <option value="IN_REVIEW">IN REVIEW</option>
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {serviceRequests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <BookOpen className="h-10 w-10 stroke-1 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-medium">No service requests found in the database.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="space-y-6 text-left">
          {!selectedCourse ? (
            /* 1. COURSES GRID LIST VIEW */
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Academy Courses Manager</h3>
                  <p className="text-xs text-slate-500">Design academic curriculums, organize modules/lessons, toggle publish settings, and track enrolled scholars.</p>
                </div>
                <button
                  onClick={() => setCreatingCourse(!creatingCourse)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  {creatingCourse ? 'Cancel Create' : '+ Create Course'}
                </button>
              </div>

              {/* Course Creator Inline Box */}
              {creatingCourse && (
                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4 max-w-xl animate-fade-in">
                  <h4 className="text-sm font-bold text-slate-800">Assemble New Training Course</h4>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Course Title</label>
                      <input
                        type="text"
                        required
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all text-slate-800"
                        placeholder="e.g. Quantitative Statistical Methods in R"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Description Outline</label>
                      <textarea
                        rows={3}
                        required
                        value={courseDesc}
                        onChange={(e) => setCourseDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all text-slate-800 resize-none"
                        placeholder="Detail the target goals, core models covered, and learning scope..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Tuition Fee ($)</label>
                      <input
                        type="number"
                        required
                        value={coursePrice}
                        onChange={(e) => setCoursePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all text-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-705 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                    >
                      Save and Create
                    </button>
                  </form>
                </div>
              )}

              {/* Courses Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminCourses.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                            c.published
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {c.published ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-xs font-black text-slate-850">${c.price || '0.00'}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{c.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-100 pt-4 mt-6">
                      <button
                        onClick={() => {
                          setSelectedCourse(c);
                          fetchSelectedCourseDetail(c.id);
                          setModuleTitle('');
                          setModuleDesc('');
                          setAddingLessonModId(null);
                          setEditingLesson(null);
                        }}
                        className="flex-1 text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-100"
                      >
                        Manage Syllabus
                      </button>
                      <button
                        onClick={() => handleTogglePublish(c.id, c.published)}
                        className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all ${
                          c.published
                            ? 'bg-amber-50 border-amber-200 text-amber-705 hover:bg-amber-100/50'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-705 hover:bg-emerald-100/50'
                        }`}
                      >
                        {c.published ? 'Take Offline' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-655 rounded-xl border border-red-100 transition-all text-xs font-bold animate-pulse"
                        title="Delete Course"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {adminCourses.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400">
                    <BookOpen className="h-10 w-10 mx-auto text-slate-300 stroke-1 mb-2 animate-pulse" />
                    <p className="text-xs font-medium">No courses have been created inside the academy yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 2. COURSE BUILDER DRILL-DOWN EDITOR VIEW */
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                <div>
                  <button
                    onClick={() => {
                      setSelectedCourse(null);
                      fetchAdminCourses();
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-650 transition-colors uppercase tracking-wider mb-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Courses List</span>
                  </button>
                  <h3 className="text-lg font-black text-slate-900 leading-snug">{selectedCourse.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{selectedCourse.description}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                      selectedCourse.published
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {selectedCourse.published ? 'Published' : 'Draft Mode'}
                  </span>
                  <button
                    onClick={() => handleTogglePublish(selectedCourse.id, selectedCourse.published)}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-750 rounded-xl text-xs font-bold transition-all border border-indigo-150 shadow-sm"
                  >
                    {selectedCourse.published ? 'Take Offline' : 'Release Publicly'}
                  </button>
                </div>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 items-start">
                {/* Modules Sidebar Creator (Left Column) */}
                <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900">Add Course Module</h4>
                  <form onSubmit={handleCreateModule} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Module Title</label>
                      <input
                        type="text"
                        required
                        value={moduleTitle}
                        onChange={(e) => setModuleTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all text-slate-800"
                        placeholder="e.g. Chapter 1: Introduction to Data Wrangling"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Overview Summary</label>
                      <textarea
                        rows={2}
                        value={moduleDesc}
                        onChange={(e) => setModuleDesc(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all text-slate-800 resize-none"
                        placeholder="Scope description of lessons inside..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                    >
                      Create Module
                    </button>
                  </form>
                </div>

                {/* Modules & Lessons Listing Area (Right Column) */}
                <div className="lg:col-span-8 space-y-6">
                  {selectedCourse.modules?.map((mod: any) => (
                    <div key={mod.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
                      {/* Module Header */}
                      <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="text-sm font-black text-slate-905 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-black text-slate-500">
                              M{mod.orderIndex}
                            </span>
                            <span>{mod.title}</span>
                          </h4>
                          {mod.description && <p className="text-xs text-slate-400 mt-1 font-medium">{mod.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setAddingLessonModId(addingLessonModId === mod.id ? null : mod.id);
                              setEditingLesson(null);
                              setLessonTitle('');
                              setLessonContent('');
                              setLessonVideo('');
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold transition-all border border-indigo-100"
                          >
                            {addingLessonModId === mod.id ? 'Cancel' : '+ Add Lesson'}
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1.5 text-red-655 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 text-[10px] font-bold"
                            title="Delete Module"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Lesson Creator / Editor Block inside Module */}
                      {((addingLessonModId === mod.id) || (editingLesson && editingLesson.moduleId === mod.id)) && (
                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                          <h5 className="text-xs font-bold text-slate-800">
                            {editingLesson ? `Edit Lesson: ${editingLesson.title}` : `Create New Lesson inside Module ${mod.orderIndex}`}
                          </h5>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Lesson Title</label>
                              <input
                                type="text"
                                value={lessonTitle}
                                onChange={(e) => setLessonTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none transition-all text-slate-805"
                                placeholder="e.g. Lesson 1.3: Statistical R plotting libraries"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Lecture Video Link (YouTube/Direct)</label>
                              <input
                                type="text"
                                value={lessonVideo}
                                onChange={(e) => setLessonVideo(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none transition-all text-slate-805"
                                placeholder="e.g. https://www.youtube.com/watch?v=..."
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Lesson Material Outline & Text Notes</label>
                            <textarea
                              rows={5}
                              value={lessonContent}
                              onChange={(e) => setLessonContent(e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none transition-all text-slate-805 resize-none leading-relaxed font-medium"
                              placeholder="Write out key takeaways, assignments instructions, or lecture scripts..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if (editingLesson) {
                                  handleUpdateLesson(editingLesson.id);
                                } else {
                                  handleCreateLesson(mod.id);
                                }
                              }}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] transition-all shadow-sm"
                            >
                              {editingLesson ? 'Save Lesson' : 'Submit Lesson'}
                            </button>
                            <button
                              onClick={() => {
                                setAddingLessonModId(null);
                                setEditingLesson(null);
                                setLessonTitle('');
                                setLessonContent('');
                                setLessonVideo('');
                              }}
                              className="px-4 py-2 border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 rounded-xl text-[10px] font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Module Lessons Checklist table */}
                      <div className="space-y-2">
                        {mod.lessons?.map((les: any, idx: number) => (
                          <div key={les.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                            <div className="min-w-0 pr-4">
                              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-slate-405">L{les.orderIndex}</span>
                                <span className="truncate">{les.title}</span>
                              </div>
                              {les.videoUrl && (
                                <div className="text-[9px] text-indigo-600 font-bold mt-0.5 truncate max-w-[250px]">
                                  Media: {les.videoUrl}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Reorder actions */}
                              <div className="flex border border-slate-200 bg-white rounded-lg overflow-hidden shadow-sm shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleReorderLesson(les.id, 'up')}
                                  disabled={idx === 0}
                                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-[10px] font-bold"
                                  title="Move Up"
                                >
                                  ▲
                                </button>
                                <div className="border-l border-slate-200" />
                                <button
                                  type="button"
                                  onClick={() => handleReorderLesson(les.id, 'down')}
                                  disabled={idx === mod.lessons.length - 1}
                                  className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-[10px] font-bold"
                                  title="Move Down"
                                >
                                  ▼
                                </button>
                              </div>

                              <button
                                onClick={() => {
                                  setEditingLesson(les);
                                  setAddingLessonModId(null);
                                  setLessonTitle(les.title);
                                  setLessonContent(les.content);
                                  setLessonVideo(les.videoUrl || '');
                                }}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-705 rounded-lg text-[10px] font-bold transition-all border border-slate-200 shadow-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(les.id)}
                                className="p-1.5 text-red-655 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 text-[10px] font-bold"
                                title="Delete Lesson"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}

                        {mod.lessons?.length === 0 && (
                          <div className="text-xs text-slate-400/80 italic text-center py-4 select-none">No lessons inside this module. Add lessons using the button above.</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {selectedCourse.modules?.length === 0 && (
                    <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400">
                      <BookOpen className="h-10 w-10 mx-auto text-slate-300 stroke-1 mb-2 animate-pulse" />
                      <p className="text-xs font-semibold">Course syllabus is empty. Create your first module on the left side menu.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Scholar Support Tickets</h3>
              <p className="text-xs text-slate-505">Resolve general inquiries, system problems, and profile modifications requested by scholars.</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-150 text-indigo-700 text-xs font-bold rounded-full">
              {tickets.length} Support Tickets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-4">Scholar</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Message</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Submitted</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-705">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{t.user?.name || 'Unknown Scholar'}</div>
                      <div className="text-xs text-slate-400">{t.user?.email || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-800">{t.subject}</td>
                    <td className="p-4 max-w-xs">
                      <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100 whitespace-pre-line max-h-[85px] overflow-y-auto">
                        {t.message}
                      </p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                          t.status === 'RESOLVED' || t.status === 'CLOSED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-amber-50 text-amber-705 border-amber-250'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <select
                        value={t.status}
                        onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                        className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <MessageSquare className="h-10 w-10 stroke-1 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-medium">No support tickets found in the database.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Payments & Revenue Overview</h2>

          {/* Financial stats widgets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Gross Revenue</div>
              <div className="text-2xl font-extrabold text-emerald-650">${financialStats.totalRevenue.toLocaleString()} USD</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active Premium Users</div>
              <div className="text-2xl font-extrabold text-indigo-650">{financialStats.activeSubscribersCount}</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Success Rate</div>
              <div className="text-2xl font-extrabold text-slate-900">{financialStats.successRate}%</div>
            </div>
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Invoices</div>
              <div className="text-2xl font-extrabold text-slate-900">{financialStats.totalTransactions}</div>
            </div>
          </div>

          {/* Payments transaction list */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4">User</th>
                  <th className="p-4">Transaction Date</th>
                  <th className="p-4">Reference Key (TxRef)</th>
                  <th className="p-4">Plan Name</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="text-xs font-bold text-slate-800">{p.user?.name || 'Scholar'}</div>
                      <div className="text-[10px] text-slate-400">{p.user?.email || 'N/A'}</div>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(p.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-400 select-all">
                      {p.txRef}
                    </td>
                    <td className="p-4 text-xs font-bold text-indigo-700 uppercase">
                      {p.planName || 'FREE'}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-900">
                      ${p.amount} {p.currency}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border tracking-wider ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                          : p.status === 'FAILED'
                          ? 'bg-red-50 text-red-750 border-red-200'
                          : 'bg-amber-50 text-amber-705 border-amber-250'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <CreditCard className="h-10 w-10 stroke-1 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-medium">No transactions found in the database.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dangerous Action Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 pb-3">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-black tracking-tight">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">{confirmModal.message}</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-900/25"
              >
                {confirmModal.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
