'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../lib/i18n';
import { useAuth } from './AuthContext';

type Language = 'en' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('onusandhan_lang') as Language;
    if (stored === 'en' || stored === 'bn') {
      setLanguageState(stored);
    }
  }, []);

  // Sync language with user profile preference when loaded
  useEffect(() => {
    if (user?.preferredLanguage === 'en' || user?.preferredLanguage === 'bn') {
      setLanguageState(user.preferredLanguage as Language);
    }
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('onusandhan_lang', lang);

    // Save preference to database if user is logged in
    if (user) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/preferred-language`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferredLanguage: lang }),
          credentials: 'include',
        });
      } catch (err) {
        console.error('Failed to save preferred language to user profile:', err);
      }
    }
  };

  const t = (path: string): any => {
    const keys = path.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return path;
      }
    }

    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
