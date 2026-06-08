'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ScholarDashboard from './scholar/page';
import FacultyDashboard from './faculty/page';
import AdminDashboard from './admin/page';

export default function DashboardRouter() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500">Synchronizing secure academic session...</p>
      </div>
    );
  }

  if (!user) return null;

  // Render dashboard based on role
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'INSTITUTION_ADMIN') {
    return <AdminDashboard />;
  }

  if (user.role === 'FACULTY') {
    return <FacultyDashboard />;
  }

  // Fallback for Research Scholar and Author
  return <ScholarDashboard />;
}
