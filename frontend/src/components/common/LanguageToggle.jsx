import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'bn';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'bn' ? 'en' : 'bn';
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all duration-200 shadow-sm active:scale-95"
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{currentLang === 'bn' ? 'English' : 'বাংলা'}</span>
    </button>
  );
};

export default LanguageToggle;

