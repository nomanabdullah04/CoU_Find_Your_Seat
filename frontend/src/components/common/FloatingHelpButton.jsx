import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PhoneCall, HelpCircle } from 'lucide-react';

const FloatingHelpButton = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isBn = i18n.language === 'bn';

  // Hide on splash screen or if already on /help
  if (location.pathname === '/' || location.pathname === '/help') {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex items-center gap-2 group">
      {/* Help label tooltip on desktop */}
      <span className="hidden md:inline-block px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {isBn ? 'সহায়তা ও ছাত্র কল্যাণ' : 'Help & Associations'}
      </span>

      <Link
        to="/help"
        aria-label="Help"
        title={isBn ? 'সহায়তা ও সমিতি' : 'Help & Associations'}
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-900/30 ring-4 ring-white transition-all transform active:scale-95 group-hover:scale-105"
      >
        <PhoneCall className="w-6 h-6 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white"></span>
        </span>
      </Link>
    </div>
  );
};

export default FloatingHelpButton;

