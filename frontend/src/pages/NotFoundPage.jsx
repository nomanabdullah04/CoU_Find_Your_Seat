import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search } from 'lucide-react';
import logoImg from '../assets/logo.png';

const NotFoundPage = () => {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6"
      >
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-100 rounded-3xl rotate-6 animate-pulse" />
          <div className="relative z-10 w-24 h-24 bg-sky-tint rounded-3xl flex items-center justify-center text-primary font-black text-4xl font-mono shadow-inner border border-blue-200">
            404
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-bangla">
            {isBn ? 'পৃষ্ঠাটি খুঁজে পাওয়া যায়নি' : 'Page Not Found'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {isBn
              ? 'আপনি যে ওয়েব ঠিকানাটি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা মুছে ফেলা হয়েছে।'
              : 'The requested link or page could not be located. Please check the URL or return to home.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link
            to="/home"
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-primary hover:bg-blue-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>{isBn ? 'হোম পেজ' : 'Go Home'}</span>
          </Link>

          <Link
            to="/home"
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-sky-tint hover:bg-blue-100 text-primary font-bold text-xs sm:text-sm border border-blue-200 transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>{isBn ? 'সিট খুঁজুন' : 'Find Seat'}</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;

