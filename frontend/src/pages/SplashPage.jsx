import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';
import busImg from '../assets/bus.webp';
import LanguageToggle from '../components/common/LanguageToggle';
import { ArrowRight } from 'lucide-react';

const SplashPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isBn = i18n.language === 'bn';
  const [isFadingOut, setIsFadingOut] = useState(false);

  const proceedToHome = () => {
    setIsFadingOut(true);
    sessionStorage.setItem('cou_splash_seen', 'true');
    setTimeout(() => {
      navigate('/home', { replace: true });
    }, 400);
  };

  useEffect(() => {
    const splashSeen = sessionStorage.getItem('cou_splash_seen');
    if (splashSeen) {
      navigate('/home', { replace: true });
      return;
    }

    const timer = setTimeout(() => {
      proceedToHome();
    }, 1400);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isFadingOut ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50 bg-gradient-to-b from-[#0B3D91] via-[#083074] to-[#051E49] flex flex-col justify-between items-center px-6 py-8 text-white overflow-hidden select-none"
      >
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-bright-blue/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md flex justify-end z-20">
          <LanguageToggle />
        </div>

        <div className="flex flex-col items-center justify-center text-center z-10 my-auto">
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-5"
          >
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-2 bg-white/10 backdrop-blur-md border border-white/25 shadow-2xl flex items-center justify-center">
              <img
                src={logoImg}
                alt="Comilla University Seal"
                className="w-full h-full object-contain rounded-full drop-shadow-md"
              />
            </div>
            <div className="absolute -inset-2 rounded-full bg-bright-blue/30 blur-md -z-10 animate-pulse" />
          </motion.div>

          <motion.div
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="space-y-1 max-w-sm"
          >
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-bangla leading-tight text-white drop-shadow">
              কুমিল্লা বিশ্ববিদ্যালয়
            </h1>
            <p className="text-sm md:text-base font-semibold tracking-wider uppercase text-sky-tint/90 font-english">
              Comilla University
            </p>
            <p className="text-xs md:text-sm text-sky-tint/70 pt-1 font-medium">
              ভর্তি পরীক্ষা সিট ফাইন্ডার · Admission Seat Finder
            </p>
          </motion.div>
        </div>

        <div className="w-full max-w-sm flex flex-col items-center z-10 space-y-4">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex flex-col items-center"
          >
            <img
              src={busImg}
              alt="Comilla University Bus"
              className="w-48 md:w-56 h-auto drop-shadow-2xl"
            />
          </motion.div>

          <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: 'linear' }}
              className="h-full bg-bright-blue rounded-full shadow-[0_0_8px_#1E6FEB]"
            />
          </div>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            onClick={proceedToHome}
            className="w-full py-3.5 px-6 rounded-2xl bg-white text-primary hover:bg-sky-tint font-bold text-sm md:text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 group min-h-[48px]"
          >
            <span>{isBn ? 'শুরু করুন' : 'Start'}</span>
            <ArrowRight className="w-4 h-4 text-bright-blue group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashPage;