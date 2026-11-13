import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageToggle from './LanguageToggle';
import TextSizeToggle from './TextSizeToggle';
import logoImg from '../../assets/logo.png';

const Header = () => {
  const { t } = useTranslation();
  const location = useLocation();

  // Hide header on splash screen
  if (location.pathname === '/') {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-primary text-white shadow-md border-b border-primary-dark">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link to="/home" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-white rounded-xl">
          <img
            src={logoImg}
            alt="Comilla University Logo"
            className="w-10 h-10 rounded-full border-2 border-white/30 object-cover shadow-sm group-hover:scale-105 transition-transform"
          />
          <div>
            <h1 className="font-bold text-sm md:text-base leading-tight tracking-tight">
              {t('university_name')}
            </h1>
            <p className="text-[11px] md:text-xs text-sky-tint/80 font-medium leading-none">
              {t('app_name')}
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links & Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-sky-tint">
            <Link to="/home" className="hover:text-white transition-colors focus-visible:underline">
              {t('nav.home')}
            </Link>
            <Link to="/steps" className="hover:text-white transition-colors focus-visible:underline">
              {t('nav.steps')}
            </Link>
            <Link to="/help" className="hover:text-white transition-colors focus-visible:underline">
              {t('nav.help')}
            </Link>
            <Link to="/about" className="hover:text-white transition-colors focus-visible:underline">
              {t('nav.about')}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <TextSizeToggle />
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
