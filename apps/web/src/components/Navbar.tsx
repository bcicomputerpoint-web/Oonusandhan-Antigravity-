'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { BookOpen, LogOut, LayoutDashboard, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-indigo-950 font-bold text-xl tracking-tight">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <span className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-teal-800 bg-clip-text text-transparent font-extrabold">
              Onusandhan AI
            </span>
          </Link>

          {/* Action links */}
          <div className="flex items-center gap-4">
            <LanguageToggle />

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold transition-all duration-200"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>{t('dashboard')}</span>
                </Link>

                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-slate-100 bg-slate-50 rounded-lg text-xs font-medium text-slate-600">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>{user.name} ({t(`roles.${user.role}`)})</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 text-sm font-medium transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-100 hover:shadow-md transition-all duration-200 active:scale-95"
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
