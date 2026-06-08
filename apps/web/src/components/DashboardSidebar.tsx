'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  LayoutDashboard,
  User,
  FileText,
  Sparkles,
  FileEdit,
  Award,
  GraduationCap,
  BookOpen,
  CreditCard,
  LifeBuoy,
  Settings,
  Menu,
  X,
  BookMarked
} from 'lucide-react';

interface SidebarProps {
  onSelectSection?: (section: string) => void;
  activeSection?: string;
}

export default function DashboardSidebar({ onSelectSection, activeSection = 'dashboard' }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'ai-tools', label: 'AI Research Tools', icon: Sparkles },
    { id: 'proposal', label: 'Research Proposal', icon: FileEdit },
    { id: 'support-services', label: 'Publication Support', icon: Award },
    { id: 'phd-tracker', label: 'PhD Application', icon: GraduationCap },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (id: string) => {
    if (onSelectSection) {
      onSelectSection(id);
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-16 z-40 w-full">
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-indigo-600" />
          <span className="font-bold text-slate-800 text-sm">Research Desk</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar overlay backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-16 lg:top-[65px] left-0 h-[calc(100vh-64px)] lg:h-[calc(100vh-65px)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between py-6 z-45 transform lg:transform-none transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6 px-4">
          {/* User Meta Card */}
          {user && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-950 truncate leading-snug">{user.name}</h4>
                <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wide truncate">
                  {t(`roles.${user.role}`)}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span>{t(`sidebar.${item.id}`)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-6 text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center">
          Onusandhan AI v1.0
        </div>
      </aside>
    </>
  );
}
