import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ListOrdered,
  CheckSquare,
  Bell,
  HelpCircle,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  RotateCcw,
  Sparkles,
  Download,
  Search
} from 'lucide-react';
import { getAdmissionSteps, getNotices, getFAQs } from '../api';

const DEFAULT_CHECKLIST_ITEMS = [
  { id: 'admit_card', key: 'item_admit', icon: '🪪', required: true },
  { id: 'id_card', key: 'item_id', icon: '🆔', required: true },
  { id: 'pens', key: 'item_pens', icon: '🖊️', required: true },
  { id: 'water_bottle', key: 'item_water', icon: '💧', required: false },
  { id: 'leave_by_time', key: 'item_leave_by', icon: '⏰', required: true },
  { id: 'no_gadgets', key: 'item_no_gadgets', icon: '🚫', required: true },
  { id: 'writing_board', key: 'item_board', icon: '📋', required: false },
];

const StepsPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isBn = i18n.language === 'bn';

  const getInitialTab = () => {
    if (location.pathname === '/checklist') return 'checklist';
    if (location.pathname === '/notices') return 'notices';
    if (location.pathname === '/faq') return 'faq';
    const param = searchParams.get('tab');
    if (param && ['steps', 'checklist', 'notices', 'faq'].includes(param)) return param;
    if (location.hash) return location.hash.replace('#', '');
    return 'steps';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [steps, setSteps] = useState([]);
  const [notices, setNotices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [openFaqId, setOpenFaqId] = useState(null);
  const [faqSearchQuery, setFaqSearchQuery] = useState('');

  const [checklist, setChecklist] = useState(() => {
    try {
      const saved = localStorage.getItem('cou_exam_checklist_v2');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  useEffect(() => {
    if (location.pathname === '/checklist') {
      setActiveTab('checklist');
      return;
    }
    if (location.pathname === '/notices') {
      setActiveTab('notices');
      return;
    }
    if (location.pathname === '/faq') {
      setActiveTab('faq');
      return;
    }
    const tabParam = searchParams.get('tab') || (location.hash ? location.hash.replace('#', '') : 'steps');
    if (tabParam && ['steps', 'checklist', 'notices', 'faq'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, location.hash, location.pathname]);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([getAdmissionSteps(), getNotices(), getFAQs()])
      .then(([stepsRes, noticesRes, faqsRes]) => {
        if (stepsRes.status === 'fulfilled') {
          const sorted = (stepsRes.value.data || []).sort((a, b) => a.order - b.order);
          setSteps(sorted);
          const initialExpanded = {};
          if (sorted[0]) initialExpanded[sorted[0].id] = true;
          if (sorted[1]) initialExpanded[sorted[1].id] = true;
          setExpandedSteps(initialExpanded);
        }
        if (noticesRes.status === 'fulfilled') {
          setNotices(noticesRes.value.data || []);
        }
        if (faqsRes.status === 'fulfilled') {
          const sortedFaqs = (faqsRes.value.data || []).sort((a, b) => a.order - b.order);
          setFaqs(sortedFaqs);
          if (sortedFaqs[0]) {
            setOpenFaqId(sortedFaqs[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleStepExpand = (stepId) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const toggleAllSteps = (expand) => {
    if (!expand) {
      setExpandedSteps({});
    } else {
      const all = {};
      steps.forEach((s) => (all[s.id] = true));
      setExpandedSteps(all);
    }
  };

  const toggleChecklistItem = (id) => {
    setChecklist((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      localStorage.setItem('cou_exam_checklist_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const resetChecklist = () => {
    setChecklist({});
    localStorage.removeItem('cou_exam_checklist_v2');
  };

  const completedCount = DEFAULT_CHECKLIST_ITEMS.filter((item) => checklist[item.id]).length;
  const totalCount = DEFAULT_CHECKLIST_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const filteredFaqs = faqs.filter((faq) => {
    const q = isBn ? faq.question_bn : faq.question_en;
    const a = isBn ? faq.answer_bn : faq.answer_en;
    const term = faqSearchQuery.toLowerCase().trim();
    if (!term) return true;
    return (q && q.toLowerCase().includes(term)) || (a && a.toLowerCase().includes(term));
  });

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-4 py-6 md:py-10 space-y-6 pb-20">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-bangla">
          {t('steps.title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          {t('steps.subtitle')}
        </p>
      </div>

      <div className="flex items-center justify-start sm:justify-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl overflow-x-auto no-scrollbar border border-slate-200 shadow-inner">
        {[
          { id: 'steps', label: t('steps.tab_steps'), icon: ListOrdered },
          { id: 'checklist', label: t('steps.tab_checklist'), icon: CheckSquare },
          { id: 'notices', label: t('steps.tab_notices'), icon: Bell },
          { id: 'faq', label: t('steps.tab_faq'), icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">তথ্য লোড হচ্ছে...</p>
        </div>
      )}

      {!loading && (
        <>
          {activeTab === 'steps' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  {isBn ? `মোট ${steps.length} টি ধাপ` : `Total ${steps.length} Steps`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAllSteps(true)}
                    className="font-semibold text-bright-blue hover:underline"
                  >
                    {t('steps.expand_all')}
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => toggleAllSteps(false)}
                    className="font-semibold text-slate-500 hover:underline"
                  >
                    {t('steps.collapse_all')}
                  </button>
                </div>
              </div>

              {steps.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 text-sm">
                  {t('steps.no_steps')}
                </div>
              ) : (
                <div className="relative border-l-2 border-primary/25 ml-4 sm:ml-6 space-y-6 pl-5 sm:pl-7">
                  {steps.map((step, idx) => {
                    const isExpanded = !!expandedSteps[step.id];
                    const title = isBn ? step.title_bn : step.title_en;
                    const desc = isBn
                      ? step.description_bn || step.description_en
                      : step.description_en || step.description_bn;

                    return (
                      <motion.div
                        key={step.id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="relative bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                      >
                        <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-bright-blue text-white text-xs sm:text-sm font-black flex items-center justify-center shadow-md ring-4 ring-slate-50 font-mono">
                          {step.order || idx + 1}
                        </div>

                        <div
                          onClick={() => toggleStepExpand(step.id)}
                          className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/50 transition-colors"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              {step.date && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-tint text-primary text-[11px] font-bold border border-blue-100">
                                  <Calendar className="w-3 h-3 text-primary" />
                                  <span>{step.date}</span>
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-800 leading-snug">
                              {title}
                            </h3>
                          </div>

                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors shrink-0 mt-0.5"
                            aria-label="Toggle Step Details"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-primary" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-slate-100 bg-slate-50/40"
                            >
                              <div className="p-4 sm:p-5 pt-3 space-y-3">
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                  {desc}
                                </p>

                                {step.link && (
                                  <div className="pt-1">
                                    <a
                                      href={step.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-blue-900 transition-colors shadow-xs"
                                    >
                                      <span>{t('steps.official_link')}</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary to-bright-blue text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-sky-200" />
                    <h3 className="font-extrabold text-base sm:text-lg">
                      {t('checklist.title')}
                    </h3>
                  </div>
                  <button
                    onClick={resetChecklist}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('checklist.reset_btn')}</span>
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-sky-100">
                  {t('checklist.subtitle')}
                </p>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-sky-200">
                    <span>
                      {t('checklist.progress', { completed: completedCount, total: totalCount })}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-400 shadow-sm"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {progressPercent === 100 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/30 border border-emerald-300/40 rounded-2xl p-3 flex items-center gap-2.5 text-xs font-semibold text-emerald-100"
                  >
                    <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                    <span>{t('checklist.ready_message')}</span>
                  </motion.div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3">
                {DEFAULT_CHECKLIST_ITEMS.map((item) => {
                  const isChecked = !!checklist[item.id];
                  const label = t(`checklist.${item.key}`);

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
                          : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/80 text-slate-700'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        {isChecked ? (
                          <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-lg border-2 border-slate-400 bg-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.icon}</span>
                          <span
                            className={`text-xs sm:text-sm font-semibold leading-relaxed ${
                              isChecked ? 'line-through text-slate-500' : 'text-slate-800'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'notices' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {t('notices.title')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('notices.subtitle')}
                </p>
              </div>

              {notices.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 text-sm">
                  {t('notices.no_notices')}
                </div>
              ) : (
                <div className="space-y-3">
                  {notices.map((notice) => {
                    const title = isBn ? notice.title_bn : notice.title_en;
                    const body = isBn
                      ? notice.body_bn || notice.body_en
                      : notice.body_en || notice.body_bn;
                    const pubDate = new Date(notice.published_at).toLocaleDateString(
                      isBn ? 'bn-BD' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    );

                    return (
                      <motion.div
                        key={notice.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white rounded-2xl p-5 border transition-all ${
                          notice.is_pinned
                            ? 'border-amber-300 bg-amber-50/30 shadow-md'
                            : 'border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {notice.is_pinned && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold border border-amber-200">
                                <Bell className="w-3 h-3 text-amber-700" />
                                <span>{t('notices.pinned')}</span>
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 font-mono">
                              {pubDate}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-2 leading-snug">
                          {title}
                        </h4>

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {body}
                        </p>

                        {notice.file && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <a
                              href={notice.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-bright-blue hover:underline"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{t('notices.download_file')}</span>
                            </a>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-lg text-slate-900">
                  {t('faq.title')}
                </h3>
                <p className="text-xs text-slate-500">
                  {t('faq.subtitle')}
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  placeholder={t('faq.search_placeholder')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
                />
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center text-slate-500 text-sm">
                  {t('faq.no_faq')}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredFaqs.map((faq) => {
                    const isOpen = openFaqId === faq.id;
                    const question = isBn ? faq.question_bn : faq.question_en;
                    const answer = isBn
                      ? faq.answer_bn || faq.answer_en
                      : faq.answer_en || faq.answer_bn;

                    return (
                      <div
                        key={faq.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                        >
                          <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                            {question}
                          </span>
                          <span className="shrink-0 p-1 text-slate-400">
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-primary" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-slate-100 bg-sky-tint/30"
                            >
                              <div className="p-4 sm:p-5 pt-3 text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StepsPage;