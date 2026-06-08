'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95"
    >
      <Globe className="h-4 w-4 text-indigo-600" />
      <span>{t('language')}</span>
    </button>
  );
};
export default LanguageToggle;
