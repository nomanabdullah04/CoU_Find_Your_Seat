import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Github, Globe, MapPin, Clock } from 'lucide-react';
import developerPhoto from '../assets/developer.png';

const AboutPage = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-xl mx-auto px-4 py-5 md:py-8 space-y-5 pb-16">
      <div className="text-center space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-bangla">
          {t('about.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          {t('about.subtitle')}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-slate-900 rounded-[18px] p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5"
      >
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          {t('about.app_card_title')}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {t('about.app_card_desc')}
        </p>

        <div className="flex flex-wrap sm:flex-nowrap gap-2.5 pt-1">
          <div className="flex-1 min-w-[140px] inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-tint/60 dark:bg-sky-950/40 border border-blue-100 dark:border-blue-900/40 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-primary dark:text-sky-400 shrink-0" />
            <span className="truncate">{t('about.feature_maps')}</span>
          </div>

          <div className="flex-1 min-w-[140px] inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{t('about.feature_leave_by')}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          background: 'radial-gradient(circle at 50% 20%, #2F7BFF 0%, #0B3D91 55%, #071F52 100%)',
        }}
        className="rounded-[28px] p-6 sm:p-7 relative overflow-hidden text-center text-white shadow-xl"
      >
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-sky-200 mb-3 drop-shadow-xs">
          {t('about.developer_label')}
        </span>

        <div className="relative z-10 flex justify-center">
          <img
            src={developerPhoto}
            alt="Abdullah Al Noman - Developer"
            className="w-[156px] h-[156px] rounded-full object-cover ring-4 ring-white/50 shadow-[0_12px_36px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-105"
          />
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.14)',
            border: '1px solid rgba(255, 255, 255, 0.32)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
          className="-mt-[30px] pt-11 pb-5 px-5 sm:px-6 rounded-[20px] shadow-lg relative z-0 space-y-1.5"
        >
          <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-xs">
            {t('about.developer_name')}
          </h4>

          <p className="text-xs sm:text-sm font-semibold text-white/95 leading-snug">
            {t('about.developer_dept')}
          </p>

          <p className="text-xs font-medium text-white/85">
            {t('about.developer_uni')}
          </p>

          <div className="pt-2.5 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href="https://nabdullah.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Portfolio - Abdullah Al Noman"
              className="min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center gap-2 rounded-full bg-white text-primary hover:bg-white/90 active:scale-95 border border-white font-bold text-xs sm:text-sm shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#071F52]"
            >
              <Globe className="w-4 h-4 shrink-0 text-primary" />
              <span>Let's Connect</span>
            </a>

            <a
              href="https://github.com/nomanabdullah04"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile - Abdullah Al Noman"
              className="min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center gap-2 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white border border-white/35 font-bold text-xs sm:text-sm shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#071F52]"
            >
              <Github className="w-4 h-4 shrink-0" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutPage;