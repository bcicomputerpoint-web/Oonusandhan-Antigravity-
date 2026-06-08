'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import DashboardSidebar from '@/components/DashboardSidebar';
import {
  BookOpen,
  FileText,
  Sparkles,
  Award,
  CreditCard,
  LifeBuoy,
  CheckCircle,
  AlertCircle,
  FileUp,
  Download,
  Calendar,
  Send,
  Plus,
  ArrowRight,
  TrendingUp,
  Mail,
  UserCheck,
  User as UserIcon,
  Search,
  Filter,
  Trash2,
  Eye,
  X,
  ChevronRight,
  Info,
  File,
  Loader2
} from 'lucide-react';

const formatBytes = (bytes: number | null | undefined) => {
  if (bytes === null || bytes === undefined) return 'N/A';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getCategoryLabel = (cat: string = 'OTHER') => {
  const mapping: Record<string, string> = {
    THESIS: 'Thesis',
    SYNOPSIS: 'Synopsis',
    PUBLICATION: 'Publication',
    CONFERENCE_PAPER: 'Conference Paper',
    SIMILARITY_REPORT: 'Similarity Report',
    AI_REPORT: 'AI Report',
    MARKSHEET: 'Marksheet',
    WORKSHOP_CERTIFICATE: 'Workshop Certificate',
    FDP_CERTIFICATE: 'FDP Certificate',
    IDENTITY_PROOF: 'Identity Proof',
    SIGNATURE: 'Signature',
    OTHER: 'Other Document'
  };
  return mapping[cat.toUpperCase()] || cat;
};

const getCategoryColorClass = (cat: string = 'OTHER') => {
  const mapping: Record<string, string> = {
    THESIS: 'bg-violet-50 text-violet-700 border-violet-200',
    SYNOPSIS: 'bg-amber-50 text-amber-700 border-amber-200',
    PUBLICATION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CONFERENCE_PAPER: 'bg-sky-50 text-sky-700 border-sky-200',
    SIMILARITY_REPORT: 'bg-rose-50 text-rose-700 border-rose-200',
    AI_REPORT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    MARKSHEET: 'bg-teal-50 text-teal-700 border-teal-200',
    WORKSHOP_CERTIFICATE: 'bg-pink-50 text-pink-700 border-pink-200',
    FDP_CERTIFICATE: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    IDENTITY_PROOF: 'bg-slate-100 text-slate-700 border-slate-300',
    SIGNATURE: 'bg-orange-50 text-orange-700 border-orange-200',
    OTHER: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return mapping[cat.toUpperCase()] || mapping.OTHER;
};

const getStatusColorClass = (status: string = 'SUBMITTED') => {
  const mapping: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
    SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
    UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
    PEER_REVIEWED: 'bg-purple-50 text-purple-700 border-purple-200',
    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return mapping[status.toUpperCase()] || mapping.SUBMITTED;
};

const getToolConfig = (tool: string) => {
  const configs: Record<string, { label: string; placeholder: string; title: string; desc: string }> = {
    'topic-selector': {
      title: 'Research Topic Selector',
      desc: 'Formulate highly relevant, indexed research topics, rationales, and critical challenges for your field.',
      label: 'Specify your general field or area of interest',
      placeholder: 'e.g., Deep Learning optimizations for low-resource translation models'
    },
    'proposal-outline': {
      title: 'Proposal Outline Generator',
      desc: 'Build structured academic proposals including Objectives, Problem Statements, and Methodologies.',
      label: 'Define your desired research proposal topic',
      placeholder: 'e.g., Design of decentralised key value stores on blockchain protocols'
    },
    'lit-review': {
      title: 'Literature Review Helper',
      desc: 'Synthesize common themes, structural references, and pinpoint open gaps in the existing body of work.',
      label: 'Input your topic for literature review synthesis',
      placeholder: 'e.g., Zero-shot transfer learning in biomedical image processing'
    },
    'abstract-generator': {
      title: 'Abstract Writer',
      desc: 'Generate a professional, structured scientific abstract summarizing context, methods, and implications.',
      label: 'Provide your research objectives, notes, or raw findings',
      placeholder: 'e.g., We evaluated Fastify gateways, measured 20% latency drops, database connects in 2ms...'
    },
    'keyword-generator': {
      title: 'Keyword Extractor',
      desc: 'Identify high-impact, standard keywords and indexing terms from your manuscript or summary text.',
      label: 'Paste draft abstract or summary notes to extract terms',
      placeholder: 'e.g., Paste a paragraphs of your draft paper here...'
    },
    'citation-suggester': {
      title: 'Citation Suggester',
      desc: 'Find foundational papers and review sample APA & IEEE reference layouts matching your hypothesis.',
      label: 'Input your core research question or hypothesis',
      placeholder: 'e.g., Secure cookie validation in Next.js edge middleware routers'
    },
    'document-summary': {
      title: 'Document Summarizer',
      desc: 'Condense complex drafts, methodologies, or analytical notes into a clean, structured summary.',
      label: 'Paste draft manuscript or section texts to summarize',
      placeholder: 'e.g., Paste raw paragraphs of your manuscript text...'
    }
  };
  return configs[tool] || configs['topic-selector'];
};

export default function ScholarDashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Shared Data States
  const [papers, setPapers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Paper form
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Service Wings and Requests States
  const [serviceWings, setServiceWings] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [selectedWingId, setSelectedWingId] = useState('');

  // DMS Integration States
  const [category, setCategory] = useState('OTHER');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // AI assistant states
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // AI Research Module States
  const [selectedAiTool, setSelectedAiTool] = useState<string>('topic-selector');
  const [aiQuery, setAiQuery] = useState('');
  const [aiConversations, setAiConversations] = useState<any[]>([]);
  const [activeAiConversationId, setActiveAiConversationId] = useState<string | null>(null);
  const [aiMessages, setAiMessages] = useState<any[]>([]);

  // Profile states
  const [bio, setBio] = useState('Academic scholar investigating natural language models.');
  const [phone, setPhone] = useState('+880 1712-345678');
  const [education, setEducation] = useState('Dhaka University');
  const [specialization, setSpecialization] = useState('Machine Learning');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Publication support states
  const [serviceDetails, setServiceDetails] = useState('');
  const [selectedWing, setSelectedWing] = useState('');
  const [serviceSuccess, setServiceSuccess] = useState('');

  // Support ticket states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');

  // Payments Integration States
  const [payments, setPayments] = useState<any[]>([]);
  const [sandboxModal, setSandboxModal] = useState<{
    isOpen: boolean;
    orderId: string;
    amount: number;
    plan: string;
  }>({
    isOpen: false,
    orderId: '',
    amount: 0,
    plan: 'PRO',
  });
  const [webhookSimulating, setWebhookSimulating] = useState(false);

  const fetchPaymentsHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/payments/history`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Error fetching payments history:', err);
    }
  };

  const handleSimulateWebhook = async (status: 'COMPLETED' | 'FAILED') => {
    setWebhookSimulating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sandbox-signature': 'sandbox_secret_key_123!'
        },
        body: JSON.stringify({
          txRef: sandboxModal.orderId,
          status,
          amount: sandboxModal.amount,
          metadata: { planName: sandboxModal.plan }
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(`Sandbox Webhook triggered: payment marked as ${status}.`);
        setSandboxModal((prev) => ({ ...prev, isOpen: false }));
        window.location.href = '/dashboard/scholar';
      } else {
        alert(data.message || 'Webhook simulation rejected.');
      }
    } catch (err) {
      alert('Error connecting to webhook receiver.');
    } finally {
      setWebhookSimulating(false);
    }
  };

  const fetchData = async () => {
    try {
      const token = document.cookie; // verify cookie
      // Fetch Papers
      const papersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers`, { credentials: 'include' });
      if (papersRes.ok) {
        const data = await papersRes.json();
        if (data.success) setPapers(data.papers || []);
      }

      // Fetch enrolled courses from API
      const enrolledRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/courses/enrolled`, { credentials: 'include' });
      if (enrolledRes.ok) {
        const enrolledData = await enrolledRes.json();
        if (enrolledData.success && enrolledData.enrollments) {
          setCourses(enrolledData.enrollments.map((e: any) => ({
            id: e.courseId,
            title: e.title,
            progress: e.progressPercent,
            instructor: 'Academy Instructor',
          })));
        }
      } else {
        // Fallback mock courses
        setCourses([
          { id: '1', title: 'Technical Writing for Scientific Journals', progress: 75, instructor: 'Dr. Rahman' },
          { id: '2', title: 'Statistical Computation & Visualization with R', progress: 30, instructor: 'Dr. Ahmed' },
        ]);
      }

      // Seed/mock notifications
      setNotifications([
        { id: '1', message: 'Your paper on "Low Resource Translation" has been assigned to a reviewer.', date: 'Today' },
        { id: '2', message: 'Enrollment in Technical Writing course was verified.', date: 'Yesterday' },
      ]);

      // Fetch Service Wings
      const wingsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/wings`, { credentials: 'include' });
      if (wingsRes.ok) {
        const wingsData = await wingsRes.json();
        if (wingsData.success) setServiceWings(wingsData.wings || []);
      }

      // Fetch Service Requests
      const reqRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/requests`, { credentials: 'include' });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        if (reqData.success) setServiceRequests(reqData.requests || []);
      }

      // Fetch Support Tickets
      const ticketsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets`, { credentials: 'include' });
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        if (ticketsData.success) setTickets(ticketsData.tickets || []);
      }

      // Fetch Payments history
      await fetchPaymentsHistory();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check for sandbox checkout parameters
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sandbox_checkout') === 'true') {
        const orderId = params.get('order_id');
        const amount = params.get('amount');
        const plan = params.get('plan');
        if (orderId && amount && plan) {
          setSandboxModal({
            isOpen: true,
            orderId,
            amount: Number(amount),
            plan,
          });
        }
      }
    }
  }, []);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setUploading(true);

    if (!file) {
      setFormError('Please select a document file.');
      setUploading(false);
      return;
    }

    // Client-side file size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds the 10MB limit.');
      setUploading(false);
      return;
    }

    // Client-side type validation
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Unsupported file type. Allowed: PDF, PNG, JPG, DOC, DOCX');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('keywords', keywords);
    formData.append('category', category);
    formData.append('manuscript', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setFormSuccess(t('scholarDash.submitSuccess'));
        setTitle('');
        setAbstract('');
        setKeywords('');
        setCategory('OTHER');
        setFile(null);
        const fileInput = document.getElementById('manuscript-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchData();
      } else {
        setFormError(data.message || 'Upload failed.');
      }
    } catch (err) {
      setFormError('Failed to upload manuscript.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!window.confirm('Are you sure you want to delete this document? This action is permanent.')) {
      return;
    }

    setDeletingId(paperId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers/${paperId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        // Refresh paper list
        fetchData();
        // Close preview if deleted
        if (selectedPaper?.id === paperId) {
          setSelectedPaper(null);
        }
      } else {
        alert(data.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting document');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchAiConversations = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/conversations`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAiConversations(data.conversations || []);
        }
      }
    } catch (err) {
      console.error('Error fetching AI conversations:', err);
    }
  };

  const handleLoadConversation = async (conversationId: string) => {
    setAiLoading(true);
    setActiveAiConversationId(conversationId);
    setAiResponse('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/conversations/${conversationId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.conversation) {
          setAiMessages(data.conversation.messages || []);
        }
      }
    } catch (err) {
      console.error('Error loading AI conversation history:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = activeAiConversationId ? aiQuery : aiPrompt;
    if (!queryText.trim()) return;

    setAiLoading(true);
    setFormError('');
    setAiResponse('');

    const payload = {
      tool: selectedAiTool,
      query: queryText,
      conversationId: activeAiConversationId || undefined,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setAiResponse(data.response);
        // Reset query text inputs
        setAiPrompt('');
        setAiQuery('');
        // Refresh conversations list
        fetchAiConversations();
        
        // If it was an active conversation, append the new messages to state
        if (activeAiConversationId) {
          setAiMessages([
            ...aiMessages,
            { sender: 'USER', content: queryText },
            { sender: 'ASSISTANT', content: data.response },
          ]);
        } else {
          // New conversation was started, auto-select it
          setActiveAiConversationId(data.conversationId);
          setAiMessages([
            { sender: 'USER', content: queryText },
            { sender: 'ASSISTANT', content: data.response },
          ]);
        }
      } else {
        setFormError(data.message || 'AI generation failed');
      }
    } catch (err) {
      setFormError('Failed to communicate with AI gateway.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setTimeout(() => {
      setProfileSuccess('Profile credentials updated successfully!');
    }, 800);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceSuccess('');
    setFormError('');
    if (!selectedWingId || !serviceDetails) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wingId: selectedWingId,
          details: serviceDetails,
        }),
        credentials: 'include',
      });

      const data = await res.json();
      if (data.success) {
        setServiceSuccess('Service support request queued successfully!');
        setServiceDetails('');
        setSelectedWingId('');
        // Refresh requests list
        const reqRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/services/requests`, { credentials: 'include' });
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          if (reqData.success) setServiceRequests(reqData.requests || []);
        }
      } else {
        setFormError(data.message || 'Failed to submit request');
      }
    } catch (err) {
      setFormError('Failed to communicate with services API.');
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketSuccess('');
    if (!ticketSubject || !ticketMessage) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: ticketSubject, message: ticketMessage }),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setTicketSubject('');
        setTicketMessage('');
        setTicketSuccess('Support ticket created successfully!');
        fetchData();
      } else {
        alert(data.message || 'Failed to submit support ticket');
      }
    } catch (err) {
      alert('Failed to connect to the support tickets API.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm text-slate-500 font-medium">Synchronizing scholar workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
      {/* Sidebar Left */}
      <DashboardSidebar onSelectSection={setActiveSection} activeSection={activeSection} />

      {/* Content Right */}
      <div className="flex-1 w-full space-y-6">
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Grid 1: Welcome & Quick Action */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Welcome Card */}
              <div className="lg:col-span-7 bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 p-8 rounded-3xl text-white shadow-xl shadow-indigo-950/10 flex flex-col justify-between min-h-[220px]">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider text-indigo-200">
                    {language === 'bn' ? 'স্কলার ওয়ার্কস্পেস' : 'Scholar Workspace'}
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    {t('scholarDash.welcome')}, {user?.name || (language === 'bn' ? 'একাডেমিক গবেষক' : 'Academic Scholar')}!
                  </h2>
                  <p className="text-indigo-200 text-sm max-w-md font-medium">
                    {t('scholarDash.manageManuscripts')}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-indigo-300 font-bold mt-4">
                  <UserCheck className="h-4 w-4" />
                  <span>{t('scholarDash.affiliation')}: {education} ({specialization})</span>
                </div>
              </div>

              {/* Research Progress Widget */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{t('scholarDash.researchProgress')}</h3>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="text-4xl font-extrabold text-slate-900">
                      {papers.filter((p) => p.status === 'ACCEPTED').length}/{Math.max(1, papers.length)}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
                        <span>{t('scholarDash.docsAccepted')}</span>
                        <span>{papers.length > 0 ? Math.round((papers.filter((p) => p.status === 'ACCEPTED').length / papers.length) * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              papers.length > 0
                                ? (papers.filter((p) => p.status === 'ACCEPTED').length / papers.length) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 mt-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{papers.length}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{t('scholarDash.submittedCount')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {papers.filter((p) => p.status === 'UNDER_REVIEW').length}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{t('scholarDash.inReviewCount')}</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">
                      {courses.filter((c) => c.progress === 100).length}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{t('scholarDash.completedCount')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Recent Documents & Quick Upload */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Recent Documents Table */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span>{t('scholarDash.recentManuscripts')}</span>
                  </h3>
                  <button
                    onClick={() => setActiveSection('documents')}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    {t('scholarDash.viewAll')}
                  </button>
                </div>

                {papers.length > 0 ? (
                  <div className="space-y-3">
                    {papers.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100 transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{p.title}</h4>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            <span className="font-semibold text-indigo-600 uppercase tracking-wide">
                              {p.status}
                            </span>
                            <span>•</span>
                            <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <a
                          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers/${p.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 transition-colors shadow-sm"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <FileText className="h-10 w-10 stroke-1 mx-auto mb-2" />
                    <p className="text-xs">{language === 'bn' ? 'কোনো ম্যানুস্ক্রিপ্ট এখনও জমা দেওয়া হয়নি।' : 'No manuscripts submitted yet.'}</p>
                  </div>
                )}
              </div>

              {/* Quick Upload Card */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-955 uppercase tracking-wider flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-indigo-600" />
                    <span>{t('scholarDash.quickUpload')}</span>
                  </h3>

                  {formError && (
                    <div className="p-3 rounded-xl bg-red-50 text-[11px] text-red-600 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-[11px] text-emerald-700 flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleFileUpload} className="space-y-3">
                    <input
                      type="text"
                      placeholder={t('scholarDash.paperTitle')}
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all"
                    />
                    <textarea
                      placeholder={t('scholarDash.abstract') + '...'}
                      required
                      rows={3}
                      value={abstract}
                      onChange={(e) => setAbstract(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all resize-none"
                    />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{language === 'bn' ? 'নথিপত্র বিভাগ' : 'Document Category'}</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all text-slate-700"
                      >
                        <option value="THESIS">{language === 'bn' ? 'থিসিস' : 'Thesis'}</option>
                        <option value="SYNOPSIS">{language === 'bn' ? 'সারসংক্ষেপ' : 'Synopsis'}</option>
                        <option value="PUBLICATION">{language === 'bn' ? 'প্রকাশনা' : 'Publication'}</option>
                        <option value="CONFERENCE_PAPER">{language === 'bn' ? 'কনফারেন্স পেপার' : 'Conference Paper'}</option>
                        <option value="SIMILARITY_REPORT">{language === 'bn' ? 'সাদৃশ্য প্রতিবেদন' : 'Similarity Report'}</option>
                        <option value="AI_REPORT">{language === 'bn' ? 'এআই প্রতিবেদন' : 'AI Report'}</option>
                        <option value="MARKSHEET">{language === 'bn' ? 'মার্কশীট' : 'Marksheet'}</option>
                        <option value="WORKSHOP_CERTIFICATE">{language === 'bn' ? 'ওয়ার্কশপ সার্টিফিকেট' : 'Workshop Certificate'}</option>
                        <option value="FDP_CERTIFICATE">{language === 'bn' ? 'এফডিপির সার্টিফিকেট' : 'FDP Certificate'}</option>
                        <option value="IDENTITY_PROOF">{language === 'bn' ? 'পরিচয় প্রমাণ' : 'Identity Proof'}</option>
                        <option value="SIGNATURE">{language === 'bn' ? 'স্বাক্ষর' : 'Signature'}</option>
                        <option value="OTHER">{language === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{language === 'bn' ? 'ফাইল নির্বাচন করুন (সর্বোচ্চ ১০ এমবি)' : 'Select File (Max 10MB)'}</label>
                      <input
                        id="manuscript-file"
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        required
                        onChange={(e) => e.target.files && setFile(e.target.files[0])}
                        className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      {uploading ? (language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...') : t('scholarDash.uploadBtn')}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Grid 3: Courses, Support, and AI Assistant */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* My Courses Widget */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-955 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <BookOpen className="h-4 w-4 text-indigo-650" />
                  <span>{language === 'bn' ? 'আমার কোর্সসমূহ' : 'My Courses'}</span>
                </h3>
                <div className="space-y-3">
                  {courses.map((c) => (
                    <Link key={c.id} href={`/courses/${c.id}`} className="block space-y-1 hover:bg-slate-50/50 p-1.5 rounded-xl transition-all">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                        <span className="truncate pr-2 group-hover:text-indigo-600 transition-colors">{c.title}</span>
                        <span>{c.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </Link>
                  ))}
                  {courses.length === 0 && (
                    <div className="text-xs text-slate-400 py-3 text-center">
                      {language === 'bn' ? 'কোনো সক্রিয় কোর্স নেই।' : 'No active enrollments.'} <Link href="/courses" className="text-indigo-600 hover:underline font-bold">{language === 'bn' ? 'ক্যাটালগ ব্রাউজ করুন' : 'Browse Catalog'}</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Service Request Status */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-955 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Award className="h-4 w-4 text-indigo-600" />
                  <span>{language === 'bn' ? 'সার্ভিস অনুরোধ স্ট্যাটাস' : 'Service Request Status'}</span>
                </h3>
                <div className="space-y-3">
                  {serviceRequests.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">{s.wing?.name || 'Academic Support'}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{s.details}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          s.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : s.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700'
                            : s.status === 'IN_PROGRESS'
                            ? 'bg-indigo-50 text-indigo-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {t(`status.${s.status}`)}
                      </span>
                    </div>
                  ))}
                  {serviceRequests.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      {language === 'bn' ? 'কোনো সক্রিয় সার্ভিস অনুরোধ নেই।' : 'No active service requests.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Notifications Widget */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-955 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  <span>{language === 'bn' ? 'বিজ্ঞপ্তিসমূহ' : 'Notifications'}</span>
                </h3>
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 bg-indigo-50/50 rounded-xl border border-indigo-50/50 flex gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-700 leading-snug">{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-semibold mt-1 block">{n.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: MY PROFILE */}
        {activeSection === 'profile' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6 max-w-2xl">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserIcon className="h-6 w-6 text-indigo-600" />
              <span>Scholar Profile Setup</span>
            </h2>

            {profileSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Affiliation University</label>
                  <input
                    type="text"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Field of Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Scholar Bio</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm resize-none"
                />
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all"
              >
                Save Changes
              </button>
            </form>
          </div>
        )}

        {/* SECTION: DOCUMENTS */}
        {activeSection === 'documents' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="h-6 w-6 text-indigo-600" />
              <span>Academic Manuscript Desk</span>
            </h2>

            {(() => {
              const filteredPapers = papers.filter((p) => {
                const matchesSearch =
                  p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.keywords &&
                    (Array.isArray(p.keywords)
                      ? p.keywords.some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()))
                      : p.keywords.toLowerCase().includes(searchQuery.toLowerCase())));

                const matchesCategory =
                  selectedCategoryFilter === 'ALL' ||
                  p.category?.toUpperCase() === selectedCategoryFilter.toUpperCase();

                return matchesSearch && matchesCategory;
              });

              return (
                <div className="space-y-6">
                  {/* Search and Filters bar */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search title, abstract, keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                      <select
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                        className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-700"
                      >
                        <option value="ALL">All Categories</option>
                        <option value="THESIS">Thesis</option>
                        <option value="SYNOPSIS">Synopsis</option>
                        <option value="PUBLICATION">Publication</option>
                        <option value="CONFERENCE_PAPER">Conference Paper</option>
                        <option value="SIMILARITY_REPORT">Similarity Report</option>
                        <option value="AI_REPORT">AI Report</option>
                        <option value="MARKSHEET">Marksheet</option>
                        <option value="WORKSHOP_CERTIFICATE">Workshop Certificate</option>
                        <option value="FDP_CERTIFICATE">FDP Certificate</option>
                        <option value="IDENTITY_PROOF">Identity Proof</option>
                        <option value="SIGNATURE">Signature</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  {filteredPapers.length > 0 ? (
                    selectedPaper ? (
                      /* Side-by-Side Split View */
                      <div className="grid lg:grid-cols-12 gap-6 items-start">
                        {/* List column */}
                        <div className="lg:col-span-4 space-y-3 max-h-[75vh] overflow-y-auto pr-1">
                          <button
                            onClick={() => setSelectedPaper(null)}
                            className="w-full py-2 px-3 text-center border border-dashed border-indigo-200 text-xs font-bold text-indigo-600 rounded-xl bg-indigo-50/30 hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5"
                          >
                            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                            <span>Back to Full Grid View</span>
                          </button>
                          
                          {filteredPapers.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPaper(p)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                                selectedPaper.id === p.id
                                  ? 'bg-indigo-50/80 border-indigo-200 ring-2 ring-indigo-600/10'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex flex-wrap gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getCategoryColorClass(p.category)}`}>
                                    {getCategoryLabel(p.category)}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getStatusColorClass(p.status)}`}>
                                    {p.status}
                                  </span>
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.title}</h4>
                                <p className="text-[10px] text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Preview detail column */}
                        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 relative">
                          {/* Close button absolute */}
                          <button
                            onClick={() => setSelectedPaper(null)}
                            className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>

                          <div className="space-y-2 pr-6">
                            <div className="flex flex-wrap gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getCategoryColorClass(selectedPaper.category)}`}>
                                {getCategoryLabel(selectedPaper.category)}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColorClass(selectedPaper.status)}`}>
                                {selectedPaper.status}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 leading-snug">{selectedPaper.title}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">{selectedPaper.abstract}</p>
                          </div>

                          {/* Metadata Indicators Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">File Size</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5">{formatBytes(selectedPaper.fileSize)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Mime Type</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5 truncate max-w-[120px]" title={selectedPaper.mimeType}>{selectedPaper.mimeType || 'Unknown'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Citations</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5">{selectedPaper.citationCount ?? 0}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">Uploaded On</div>
                              <div className="text-xs font-bold text-slate-800 mt-0.5">{new Date(selectedPaper.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>

                          {/* Mock PDF Viewer */}
                          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                            {/* Viewer Controls bar */}
                            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-600 font-semibold select-none">
                              <span className="truncate max-w-[200px] flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-slate-500" />
                                <span>{selectedPaper.title}.pdf</span>
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="hover:bg-slate-200 px-1 rounded cursor-pointer">-</span>
                                <span>100%</span>
                                <span className="hover:bg-slate-200 px-1 rounded cursor-pointer">+</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span>Page 1 of 1</span>
                              </div>
                            </div>
                            {/* Viewer Body */}
                            <div className="bg-slate-700 p-6 flex justify-center items-start min-h-[350px] max-h-[420px] overflow-y-auto">
                              <div className="bg-white w-full max-w-[500px] p-8 shadow-xl border border-slate-300 rounded-sm relative text-left select-none pointer-events-none">
                                {/* Watermark */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none rotate-45 text-slate-900 font-extrabold text-3xl text-center">
                                  ONUSANDHAN AI<br />PEER REVIEW
                                </div>
                                <div className="space-y-4">
                                  <div className="text-center pb-4 border-b border-slate-100 space-y-1">
                                    <h4 className="text-[11px] font-bold text-slate-900 leading-snug uppercase">{selectedPaper.title}</h4>
                                    <p className="text-[9px] text-slate-500 font-medium">{selectedPaper.author?.name || user?.name || 'Academic Scholar'} • Onusandhan AI Portal</p>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wide">Abstract</div>
                                    <p className="text-[8px] text-slate-500 leading-normal italic font-medium">
                                      {selectedPaper.abstract}
                                    </p>
                                  </div>
                                  <div className="space-y-2 pt-2">
                                    <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wide">1. Introduction</div>
                                    <div className="space-y-1.5">
                                      <div className="h-2 w-full bg-slate-100 rounded"></div>
                                      <div className="h-2 w-full bg-slate-100 rounded"></div>
                                      <div className="h-2 w-[90%] bg-slate-100 rounded"></div>
                                      <div className="h-2 w-full bg-slate-100 rounded"></div>
                                      <div className="h-2 w-[85%] bg-slate-100 rounded"></div>
                                    </div>
                                  </div>
                                  <div className="space-y-2 pt-2">
                                    <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wide">2. Methodology</div>
                                    <div className="space-y-1.5">
                                      <div className="h-2 w-[95%] bg-slate-100 rounded"></div>
                                      <div className="h-2 w-[92%] bg-slate-100 rounded"></div>
                                      <div className="h-2 w-[80%] bg-slate-100 rounded"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex gap-4 border-t border-slate-100 pt-4">
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers/${selectedPaper.id}/download`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex-1"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download File</span>
                            </a>
                            <button
                              onClick={() => handleDeletePaper(selectedPaper.id)}
                              disabled={deletingId !== null}
                              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-xs font-semibold rounded-xl transition-all"
                            >
                              {deletingId === selectedPaper.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete Document</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Grid View */
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPapers.map((p) => (
                          <div
                            key={p.id}
                            className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group relative"
                          >
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-1.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getCategoryColorClass(p.category)}`}>
                                  {getCategoryLabel(p.category)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${getStatusColorClass(p.status)}`}>
                                  {p.status}
                                </span>
                              </div>
                              <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{p.title}</h3>
                              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{p.abstract}</p>
                              {p.fileSize && (
                                <div className="text-[10px] text-slate-400 font-semibold">
                                  Size: {formatBytes(p.fileSize)}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center gap-4 border-t border-slate-100 pt-4 mt-6">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedPaper(p)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
                                >
                                  <Eye className="h-3 w-3" />
                                  <span>Preview</span>
                                </button>
                                <a
                                  href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/papers/${p.id}/download`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 border border-slate-200 transition-colors"
                                  title="Download"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  onClick={() => handleDeletePaper(p.id)}
                                  disabled={deletingId !== null}
                                  className="p-1.5 bg-red-50/50 hover:bg-red-50 hover:text-red-600 rounded-lg text-red-500 border border-red-100 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 max-w-xl mx-auto">
                      <FileText className="h-12 w-12 stroke-1 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-semibold">No documents matched your query.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* SECTION: AI RESEARCH TOOLS */}
        {activeSection === 'ai-tools' && (
          <div className="space-y-6 w-full">
            {/* Top Warning Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl text-xs text-amber-800 flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold block mb-0.5">Important AI Verification Disclaimer</span>
                Onusandhan AI Research Tools are designed to assist and accelerate your academic outputs. However, AI responses may contain errors or inaccuracies. Researchers are solely responsible for reviewing and verifying all facts, outlines, citation scopes, and drafts independently prior to formal academic submission.
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Tools list & Session History */}
              <div className="lg:col-span-4 space-y-6">
                {/* Tools Tab List */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">AI Tools</h3>
                  <div className="space-y-1">
                    {[
                      { id: 'topic-selector', label: 'Topic Selector' },
                      { id: 'proposal-outline', label: 'Proposal Generator' },
                      { id: 'lit-review', label: 'Literature Synthesis' },
                      { id: 'abstract-generator', label: 'Abstract Writer' },
                      { id: 'keyword-generator', label: 'Keyword Extractor' },
                      { id: 'citation-suggester', label: 'Citation Suggester' },
                      { id: 'document-summary', label: 'Document Summarizer' },
                    ].map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => {
                          setSelectedAiTool(tool.id);
                          setActiveAiConversationId(null);
                          setAiResponse('');
                        }}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between ${
                          selectedAiTool === tool.id && !activeAiConversationId
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-transparent text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{tool.label}</span>
                        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session Logs List */}
                <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Consultation Logs</h3>
                  {aiConversations.length > 0 ? (
                    <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                      {aiConversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => handleLoadConversation(conv.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            activeAiConversationId === conv.id
                              ? 'bg-indigo-50 border-indigo-200'
                              : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="text-[11px] font-bold text-slate-800 line-clamp-1">{conv.topic || 'AI Consultation'}</div>
                          <div className="text-[9px] text-slate-400 mt-1">{new Date(conv.updatedAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-[10px]">
                      No previous logs found.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Dynamic Form or Conversation Chat Panel */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[450px] flex flex-col justify-between">
                {activeAiConversationId ? (
                  /* Conversation Chat Panel */
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase">Consultation Chat Thread</h3>
                        <p className="text-[10px] text-slate-400">Continue your research discussion with Onusandhan AI.</p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveAiConversationId(null);
                          setAiResponse('');
                        }}
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        Start New Tool Run
                      </button>
                    </div>

                    {/* Messages List */}
                    <div className="space-y-4 max-h-[350px] overflow-y-auto flex-1 pr-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                      {aiMessages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`rounded-2xl max-w-[85%] text-xs p-4 leading-relaxed ${
                              msg.sender === 'USER'
                                ? 'bg-indigo-600 text-white font-medium'
                                : 'bg-white border border-slate-200 text-slate-800 whitespace-pre-line shadow-sm'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {aiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-sm text-slate-400 text-xs">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            <span>Thinking...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input box */}
                    <form onSubmit={handleAiSubmit} className="flex gap-3 mt-4">
                      <textarea
                        rows={2}
                        required
                        placeholder="Type a follow-up message..."
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none transition-all resize-none text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={aiLoading}
                        className="px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center justify-center"
                      >
                        {aiLoading ? 'Sending...' : <Send className="h-4 w-4" />}
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Tool Creation Form */
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{getToolConfig(selectedAiTool).title}</h3>
                          <p className="text-xs text-slate-500">{getToolConfig(selectedAiTool).desc}</p>
                        </div>
                      </div>

                      {formError && (
                        <div className="p-3 rounded-xl bg-red-50 text-[11px] text-red-600 flex items-start gap-2 mt-4">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>{formError}</span>
                        </div>
                      )}

                      <form onSubmit={handleAiSubmit} className="space-y-4 mt-6">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{getToolConfig(selectedAiTool).label}</label>
                          <textarea
                            rows={6}
                            required
                            placeholder={getToolConfig(selectedAiTool).placeholder}
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-800"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={aiLoading}
                          className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5"
                        >
                          {aiLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Generating Research Outline...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>Submit Research Query</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Result Container if returned */}
                    {aiResponse && (
                      <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2.5 mt-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">AI Generated Result</h4>
                          <span className="text-[9px] text-slate-400 font-semibold">Consultation auto-saved</span>
                        </div>
                        <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-mono bg-white p-4 rounded-xl border border-slate-100 shadow-sm max-h-[300px] overflow-y-auto">{aiResponse}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: PUBLICATION SUPPORT */}
        {activeSection === 'support-services' && (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <span>Request Support Service</span>
              </h2>

              {serviceSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-250 text-xs text-emerald-700 flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
                  <span>{serviceSuccess}</span>
                </div>
              )}

              {formError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-255 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Select Service Wing</label>
                  <select
                    value={selectedWingId}
                    required
                    onChange={(e) => setSelectedWingId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm text-slate-705"
                  >
                    <option value="">-- Select Wing --</option>
                    {serviceWings.map((wing) => (
                      <option key={wing.id} value={wing.id}>
                        {wing.name} (${wing.priceRate}/hr)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Describe Support Requirements</label>
                  <textarea
                    required
                    rows={4}
                    value={serviceDetails}
                    onChange={(e) => setServiceDetails(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm resize-none text-slate-800"
                    placeholder="Describe your goals, targets, draft contents, and deadlines..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Submit Service Request
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Support Request History</h2>
              
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {serviceRequests.map((s) => {
                  const statusSteps = ['NEW', 'IN_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
                  const activeIdx = statusSteps.indexOf(s.status.toUpperCase());
                  const isCancelled = s.status === 'CANCELLED';

                  return (
                    <div key={s.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-slate-905">{s.wing?.name || 'Academic Support'}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">Submitted: {new Date(s.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-slate-505 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{s.details}</p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${
                            s.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>

                      {/* Visual Progress Stepper */}
                      {!isCancelled ? (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex justify-between items-center relative">
                            {/* Connector line */}
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-10" />
                            <div
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-500 -z-10 transition-all duration-300"
                              style={{ width: `${activeIdx > 0 ? (activeIdx / 4) * 100 : 0}%` }}
                            />

                            {statusSteps.map((step, idx) => {
                              const isPassed = idx <= activeIdx;
                              const isCurrent = idx === activeIdx;

                              return (
                                <div key={step} className="flex flex-col items-center gap-1.5 relative bg-white px-2">
                                  <div
                                    className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                                      isPassed
                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                        : 'bg-white text-slate-350 border-slate-200'
                                    } ${isCurrent ? 'ring-4 ring-indigo-100 animate-pulse' : ''}`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <span className={`text-[8px] font-bold uppercase tracking-wider ${
                                    isPassed ? 'text-indigo-600' : 'text-slate-400'
                                  }`}>
                                    {step.replace('_', ' ')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 bg-red-50 text-red-700 text-[10px] font-bold rounded-xl border border-red-100">
                          This request has been cancelled.
                        </div>
                      )}
                    </div>
                  );
                })}

                {serviceRequests.length === 0 && (
                  <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-3xl text-slate-450">
                    <Award className="h-10 w-10 stroke-1 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold">No active service requests found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: COURSES */}
        {activeSection === 'courses' && (() => {
          // Find first course with progress < 100% to continue learning
          const continueCourse = courses.find((c) => c.progress < 100) || courses[0];

          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="h-6 w-6 text-indigo-600" />
                <span>Enrollments & Classrooms</span>
              </h2>

              {/* Continue Learning Widget Card */}
              {continueCourse && (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 rounded-3xl shadow-md space-y-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Continue Learning</span>
                    <h3 className="text-lg font-bold">{continueCourse.title}</h3>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 pt-2">
                    <div className="flex-1 max-w-md">
                      <div className="flex justify-between text-xs font-bold text-indigo-200 mb-1">
                        <span>Course Completion</span>
                        <span>{continueCourse.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${continueCourse.progress}%` }} />
                      </div>
                    </div>
                    <Link
                      href={`/courses/${continueCourse.id}`}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-all text-center shadow-md shadow-indigo-900/40"
                    >
                      Resume Study
                    </Link>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col justify-between gap-6 hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{c.title}</h3>
                      <p className="text-xs text-slate-550">Instructor: {c.instructor}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                          <span>Course Progress</span>
                          <span>{c.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${c.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Link
                          href={`/courses/${c.id}`}
                          className="flex-1 text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-100"
                        >
                          Go to Classroom
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {courses.length === 0 && (
                <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 max-w-xl mx-auto">
                  <BookOpen className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold">You have not enrolled in any training programs yet.</p>
                  <Link href="/courses" className="text-xs text-indigo-600 hover:underline font-bold mt-2 inline-block">
                    Explore Academy Catalog
                  </Link>
                </div>
              )}
            </div>
          );
        })()}

        {/* SECTION: SUPPORT */}
        {activeSection === 'support' && (
          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-indigo-600" />
                <span>Support Desk</span>
              </h2>

              {ticketSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{ticketSuccess}</span>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Subject</label>
                  <input
                    type="text"
                    required
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Message details</label>
                  <textarea
                    required
                    rows={4}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  Create Ticket
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-xl font-bold text-slate-900">Support Ticket History</h2>
              <div className="space-y-4">
                {tickets.map((t) => (
                  <div key={t.id} className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{t.subject}</h4>
                      <p className="text-xs text-slate-400 mt-1">Created: {t.date}</p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
                {/* SECTION: PAYMENTS */}
        {activeSection === 'payments' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="h-6 w-6 text-indigo-600" />
              <span>Payments & Subscriptions</span>
            </h2>

            {/* Current Plan Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Plan</span>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-xl font-extrabold text-slate-900 uppercase">
                    {user?.plan === 'FREE' ? 'Scholar Basic' : user?.plan === 'PRO' ? 'Scholar Pro' : user?.plan === 'LABS' ? 'Research Lab' : (user?.plan || 'FREE')}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${
                    user?.plan && user.plan !== 'FREE' ? 'bg-indigo-55 text-indigo-700 border-indigo-200' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    {user?.plan && user.plan !== 'FREE' ? 'Premium Tier' : 'Free Tier'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed mt-1 font-medium">
                  {user?.plan && user.plan !== 'FREE' 
                    ? 'Thank you for supporting Onusandhan AI! You have unlocked all premium writing engines, catalog reviews, and prioritization algorithms.'
                    : 'Get access to priority peer reviewers, 7 advanced AI research utilities, custom synopsis builders, and scientific proofreading services.'
                  }
                </p>
              </div>

              {user?.plan === 'FREE' && (
                <Link
                  href="/pricing"
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0 text-center"
                >
                  Upgrade Membership
                </Link>
              )}
            </div>

            {/* Payments History Table */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Transaction History</h3>

              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wide">
                        <th className="pb-3 pl-2">Transaction Date</th>
                        <th className="pb-3">Reference (TxRef)</th>
                        <th className="pb-3">Subscribed Plan</th>
                        <th className="pb-3">Amount Charged</th>
                        <th className="pb-3 pr-2 text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id} className="text-slate-750 font-semibold hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 pl-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="py-3.5 font-mono text-[10px] text-slate-405 select-all">{p.txRef}</td>
                          <td className="py-3.5 uppercase font-bold text-slate-800">{p.planName || 'FREE'}</td>
                          <td className="py-3.5 font-semibold text-slate-900">${p.amount} {p.currency}</td>
                          <td className="py-3.5 pr-2 text-right">
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
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <CreditCard className="h-10 w-10 mx-auto stroke-1 text-slate-350 mb-2" />
                  <p className="text-xs">No payment records found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MOCK PLACEHOLDERS FOR REMAINING PATHS */}
        {(activeSection === 'proposal' ||
          activeSection === 'phd-tracker' ||
          activeSection === 'settings') && (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 max-w-xl">
            <h2 className="text-xl font-bold text-slate-900 capitalize">{activeSection.replace('-', ' ')}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              This module is active and integration-ready! In production, this section connects directly to your
              academic databases and custom microservices.
            </p>
            <div className="p-4 bg-indigo-50 text-xs font-bold text-indigo-700 rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Workspace connected and verified.</span>
            </div>
          </div>
        )}
      </div>

      {/* Sandbox Checkout Simulator Modal */}
      {sandboxModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-black tracking-wider rounded-full uppercase">
                Sandbox Payment Simulation
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">Confirm Sandbox Checkout</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This transaction uses the secure extensible Sandbox payment provider mock.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs space-y-2.5">
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Order Reference:</span>
                <span className="text-slate-800 font-mono font-bold select-all">{sandboxModal.orderId}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-slate-400">Subscribed Plan:</span>
                <span className="text-indigo-650 font-black uppercase">{sandboxModal.plan}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t border-slate-200 text-sm font-bold">
                <span className="text-slate-905">Total Amount:</span>
                <span className="text-slate-905">${sandboxModal.amount}.00 USD</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleSimulateWebhook('COMPLETED')}
                disabled={webhookSimulating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex justify-center items-center gap-1.5"
              >
                {webhookSimulating && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                <span>Simulate Payment Success</span>
              </button>
              <button
                onClick={() => handleSimulateWebhook('FAILED')}
                disabled={webhookSimulating}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 disabled:bg-slate-100 text-rose-700 border border-rose-150 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Simulate Payment Failure
              </button>
              <button
                onClick={() => setSandboxModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={webhookSimulating}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-500 rounded-2xl text-xs font-bold transition-all"
              >
                Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
