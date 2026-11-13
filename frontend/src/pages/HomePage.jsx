import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ListOrdered,
  CheckSquare,
  Bell,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { searchSeat, getSiteSettings, getNotices } from '../api';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isBn = i18n.language === 'bn';

  const [roll, setRoll] = useState('');
  const [verifyField, setVerifyField] = useState('');
  const [requireVerification, setRequireVerification] = useState(false);
  const [verifyLabel, setVerifyLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notices, setNotices] = useState([]);
  const [showNoticesModal, setShowNoticesModal] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then((res) => {
        setRequireVerification(res.data.require_verification);
        setVerifyLabel(
          isBn
            ? res.data.verification_field_label_bn || res.data.verification_field_label_en
            : res.data.verification_field_label_en || res.data.verification_field_label_bn
        );
      })
      .catch(() => { });

    getNotices()
      .then((res) => setNotices(res.data))
      .catch(() => { });
  }, [isBn]);

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanRoll = roll.trim();

    if (!cleanRoll) {
      setError(isBn ? 'অনুগ্রহ করে রোল নম্বর প্রদান করুন।' : 'Please enter your Admission Roll.');
      return;
    }

    if (!/^\d+$/.test(cleanRoll)) {
      setError(isBn ? 'রোল নম্বর শুধুমাত্র সংখ্যা (ডিজিট) হতে হবে।' : 'Admission Roll must contain numbers only.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await searchSeat(cleanRoll, verifyField.trim() || null);
      if (res.data.found) {
        navigate('/result', { state: { resultData: res.data } });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        navigate('/result', {
          state: {
            notFound: true,
            searchedRoll: cleanRoll,
            helpdesk: err.response.data?.helpdesk,
          },
        });
      } else if (err.response?.status === 403) {
        setError(
          isBn
            ? err.response.data.message_bn || 'যাচাইকরণ ব্যর্থ হয়েছে।'
            : err.response.data.message_en || 'Verification failed.'
        );
      } else if (err.response?.status === 429) {
        setError(
          isBn
            ? err.response.data.message_bn || 'অনুসন্ধানের সর্বোচ্চ সীমা অতিক্রম করেছে। এক মিনিট অপেক্ষা করুন।'
            : err.response.data.message_en || 'Rate limit exceeded. Please wait a minute.'
        );
      } else {
        setError(
          isBn
            ? 'সার্ভারে সংযোগ করা যাচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।'
            : 'Unable to connect to server. Please try again shortly.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const pinnedNotice = notices.find((n) => n.is_pinned) || notices[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      {pinnedNotice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50/90 border border-amber-200/80 rounded-[16px] p-4 shadow-sm flex items-start gap-3.5"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                {isBn ? 'জরুরি নোটিশ' : 'Notice'}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(pinnedNotice.published_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs md:text-sm font-semibold text-slate-800 mt-1 truncate">
              {isBn ? pinnedNotice.title_bn : pinnedNotice.title_en}
            </p>
          </div>
          <button
            onClick={() => setShowNoticesModal(true)}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 underline flex-shrink-0 self-center"
          >
            {isBn ? 'পড়ুন' : 'Read'}
          </button>
        </motion.div>
      )}

      <div className="bg-gradient-to-br from-primary via-[#0d469e] to-bright-blue rounded-[20px] p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-bright-blue/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight font-bangla text-white drop-shadow-sm">
              {isBn ? 'আপনার সিট খুঁজুন' : 'Find Your Seat'}
            </h2>
            <p className="text-sky-tint/90 text-xs md:text-sm font-medium mt-1">
              {isBn
                ? 'ভর্তি পরীক্ষার রোল নম্বর দিয়ে সরাসরি আপনার পরীক্ষার কেন্দ্র, ভবন, রুম ও আসন নম্বর দেখুন'
                : 'Enter your Admission Roll to view your center, building, room, and seat number'}
            </p>
          </motion.div>

          <form onSubmit={handleSearch} className="pt-4 space-y-3.5 text-left">
            <div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  autoFocus
                  value={roll}
                  onChange={(e) => {
                    setRoll(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={
                    isBn
                      ? 'ভর্তি পরীক্ষার রোল লিখুন (যেমন: 100201)'
                      : 'Enter Admission Roll (e.g. 100201)'
                  }
                  className="w-full min-h-[52px] md:min-h-[56px] py-3.5 pl-12 pr-4 rounded-[16px] bg-white text-slate-900 placeholder:text-slate-400 font-semibold text-base md:text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-bright-blue/40 transition-all font-mono"
                  required
                />
                <Search className="w-5 h-5 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {requireVerification && (
              <div className="relative">
                <input
                  type="text"
                  value={verifyField}
                  onChange={(e) => {
                    setVerifyField(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={
                    verifyLabel ||
                    (isBn
                      ? 'মোবাইল নম্বরের শেষ ৪ ডিজিট / প্রবেশপত্র সিরিয়াল'
                      : 'Last 4 digits of phone / Admit Serial')
                  }
                  className="w-full min-h-[48px] py-3 pl-12 pr-4 rounded-[16px] bg-white/95 text-slate-900 placeholder:text-slate-400 font-medium text-sm shadow-md focus:outline-none focus:ring-4 focus:ring-bright-blue/40 transition-all"
                  required
                />
                <ShieldCheck className="w-5 h-5 text-primary absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-600/90 text-white p-3 rounded-[14px] text-xs font-semibold flex items-center gap-2 shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] md:min-h-[52px] py-3.5 px-6 rounded-[16px] bg-bright-blue hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-base md:text-lg shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isBn ? 'খোঁজা হচ্ছে...' : 'Searching...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>{isBn ? 'সিট খুঁজুন' : 'Search Seat'}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/steps"
          className="bg-white dark:bg-slate-900 p-5 rounded-[16px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-bright-blue/60 transition-all group flex flex-col justify-between min-h-[140px]"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-tint dark:bg-sky-950/60 flex items-center justify-center text-primary dark:text-sky-400 group-hover:bg-primary group-hover:text-white transition-colors mb-3">
              <ListOrdered className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base group-hover:text-primary transition-colors">
              {isBn ? 'ভর্তি নির্দেশিকা' : 'Admission Steps'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isBn
                ? 'আবেদন থেকে শুরু করে মেধা তালিকা ও চূড়ান্ত ভর্তি পর্যন্ত ১০টি ধাপ'
                : '10-step complete roadmap from circular to final admission'}
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-bright-blue pt-3 group-hover:translate-x-1 transition-transform">
            <span>{isBn ? 'ধাপগুলো দেখুন' : 'View Steps'}</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </div>
        </Link>

        <Link
          to="/steps#checklist"
          className="bg-white dark:bg-slate-900 p-5 rounded-[16px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-success/60 transition-all group flex flex-col justify-between min-h-[140px]"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-emerald-950/60 flex items-center justify-center text-success dark:text-emerald-400 group-hover:bg-success group-hover:text-white transition-colors mb-3">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base group-hover:text-success transition-colors">
              {isBn ? 'পরীক্ষা র চেকলিস্ট' : 'Exam Checklist'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isBn
                ? 'প্রবেশপত্র, কলম ও রেজিস্ট্রেশন কার্ডের মতো জরুরি উপকরণের তালিকা'
                : 'Interactive tick-list for admit card, pens, and essentials'}
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-success pt-3 group-hover:translate-x-1 transition-transform">
            <span>{isBn ? 'চেকলিস্ট খুলুন' : 'Open Checklist'}</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </div>
        </Link>

        <button
          onClick={() => setShowNoticesModal(true)}
          className="bg-white dark:bg-slate-900 p-5 rounded-[16px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 transition-all group flex flex-col justify-between text-left min-h-[140px]"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors mb-3">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base group-hover:text-amber-700 transition-colors">
              {isBn ? 'নোটিশ ও আপডেট' : 'Notices & Updates'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {isBn
                ? ' নির্দেশনা, পরিবহন শিডিউল ও জরুরি বিজ্ঞপ্তি'
                : 'Center guidelines, transport schedules, and alerts'}
            </p>
          </div>
          <div className="flex items-center text-xs font-bold text-amber-600 pt-3 group-hover:translate-x-1 transition-transform">
            <span>{isBn ? 'নোটিশ পড়ুন' : 'View Notices'}</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </div>
        </button>
      </div>

      <AnimatePresence>
        {showNoticesModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[20px] max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary dark:text-sky-400" />
                  <h3 className="font-bold text-base text-slate-800 dark:text-white">
                    {isBn ? 'ভর্তি পরীক্ষার নোটিশসমূহ' : 'Admission Notices'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNoticesModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {notices.map((n) => (
                  <div key={n.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {n.is_pinned && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                          {isBn ? 'পিনকৃত' : 'Pinned'}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {new Date(n.published_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {isBn ? n.title_bn : n.title_en}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {isBn ? n.body_bn : n.body_en}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-right">
                <button
                  onClick={() => setShowNoticesModal(false)}
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
