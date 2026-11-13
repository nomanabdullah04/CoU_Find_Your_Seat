import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PhoneCall,
  Phone,
  MessageCircle,
  Search,
  Compass,
  ShieldAlert,
  Users,
  Clock,
  ChevronRight,
  X,
  LifeBuoy
} from 'lucide-react';
import { getHelpData } from '../api';

const HelpPage = () => {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const [helpData, setHelpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAssociation, setSelectedAssociation] = useState(null);

  useEffect(() => {
    setLoading(true);
    getHelpData()
      .then((res) => {
        setHelpData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const primaryHelpline = helpData?.primary_helpline || {
    label_bn: 'কেন্দ্রীয় ভর্তি হেল্পডেস্ক (প্রধান)',
    label_en: 'Central Admission Helpline (Primary)',
    phone: '+880 1711-223344',
  };

  const emergencyHelplines = (helpData?.emergency_helplines || []).filter(
    (h) => !h.is_primary
  );

  const associations = helpData?.associations || [];

  const filteredAssociations = associations.filter((assoc) => {
    const matchesType = selectedType === 'all' || assoc.type === selectedType;
    const nameMatch =
      (assoc.name_bn && assoc.name_bn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (assoc.name_en && assoc.name_en.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && (searchQuery ? nameMatch : true);
  });

  return (
    <div className="max-w-3xl mx-auto px-3.5 sm:px-4 py-6 md:py-10 space-y-6 pb-24">
      <div className="text-center space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          <LifeBuoy className="w-3.5 h-3.5 animate-spin" />
          <span>{isBn ? 'জরুরি সহায়তা ও ছাত্র কল্যাণ' : 'Help & Student Support'}</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-bangla">
          {isBn ? 'সহায়তা ও সমিতি কেন্দ্র' : 'Helpdesk & Associations'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          {isBn
            ? 'ভর্তি পরীক্ষায় যেকোনো জরুরি সমস্যায় সরাসরি কল করুন অথবা আপনার এলাকার ছাত্র কল্যাণ সমিতির সাথে যোগাযোগ করুন'
            : 'Get instant helpline assistance or connect with student welfare associations from your home district/division'}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-900 to-bright-blue text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5"
      >
        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-sky-200">
            {isBn ? 'প্রধান ভর্তি হেল্পলাইন' : 'Official Primary Helpline'}
          </span>
          <h3 className="text-lg sm:text-xl font-black text-white">
            {isBn ? primaryHelpline.label_bn : primaryHelpline.label_en}
          </h3>
          <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white pt-1">
            {primaryHelpline.phone}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <a
            href={`tel:${primaryHelpline.phone}`}
            className="min-h-[50px] py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-primary font-black text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-95 text-center"
          >
            <PhoneCall className="w-5 h-5 text-primary shrink-0" />
            <span>{isBn ? 'সরাসরি কল করুন' : 'Call Helpline Now'}</span>
          </a>

          <a
            href={`tel:${primaryHelpline.phone}`}
            className="min-h-[50px] py-3.5 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2.5 transition-all active:scale-95 text-center border border-rose-400"
          >
            <Compass className="w-5 h-5 text-white shrink-0 animate-spin" />
            <span>{isBn ? '🚨 আমি পথ হারিয়েছি (I am Lost)' : '🚨 I Am Lost (Get Help)'}</span>
          </a>
        </div>
      </motion.div>

      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <ShieldAlert className="w-4 h-4 text-primary" />
          <span>{isBn ? 'জরুরি জরুরি সেবা ও নিরাপত্তা' : 'Emergency & Security Numbers'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {emergencyHelplines.map((emg) => (
            <div
              key={emg.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-primary/50 transition-colors"
            >
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                  {isBn ? 'জরুরি সংযোগ' : 'Emergency Contact'}
                </span>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-snug mt-0.5">
                  {isBn ? emg.label_bn : emg.label_en}
                </h4>
                <p className="font-mono font-black text-base text-primary mt-1">
                  {emg.phone}
                </p>
              </div>

              <a
                href={`tel:${emg.phone}`}
                className="w-full py-2.5 px-3 rounded-xl bg-sky-tint hover:bg-blue-100 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isBn ? 'কল করুন' : 'Call'}</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <span>{isBn ? 'জেলা ও বিভাগীয় ছাত্র কল্যাণ পরিষদ' : 'District & Division Student Associations'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            {isBn
              ? 'ক্যাম্পাসে দিকনির্দেশনা ও যেকোনো প্রয়োজনে আপনার এলাকার সিনিয়র ভাইয়া/আপুদের সাথে যোগাযোগ করুন'
              : 'Contact student association representatives from your division or district for campus guidance and local support'}
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isBn
                ? 'জেলা, বিভাগ বা সমিতির নাম লিখে খুঁজুন (যেমন: ঢাকা, সিলেট, বরিশাল)...'
                : 'Search by district, division, or association name...'
            }
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: isBn ? 'সব সমিতি' : 'All' },
            { id: 'division', label: isBn ? 'বিভাগীয়' : 'Division' },
            { id: 'district', label: isBn ? 'জেলাভিত্তিক' : 'District' },
            { id: 'other', label: isBn ? 'অন্যান্য' : 'Other' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">তথ্য লোড হচ্ছে...</p>
          </div>
        ) : filteredAssociations.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-500 text-xs sm:text-sm">
            {isBn ? 'কোনো ছাত্র কল্যাণ সমিতি পাওয়া যায়নি।' : 'No student associations matched your search query.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredAssociations.map((assoc) => {
              const name = isBn ? assoc.name_bn : assoc.name_en;
              const typeLabel =
                assoc.type === 'division'
                  ? (isBn ? 'বিভাগীয়' : 'Division')
                  : assoc.type === 'district'
                  ? (isBn ? 'জেলাভিত্তিক' : 'District')
                  : (isBn ? 'অন্যান্য' : 'Other');

              return (
                <div
                  key={assoc.id}
                  onClick={() => setSelectedAssociation(assoc)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1.5 min-w-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-sky-tint text-primary text-[10px] font-bold">
                      {typeLabel}
                    </span>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-primary transition-colors leading-snug line-clamp-1">
                      {name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {isBn
                        ? `${assoc.contacts?.length || 0} জন প্রতিনিধি সক্রিয়`
                        : `${assoc.contacts?.length || 0} Representative(s) available`}
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-primary group-hover:text-white text-slate-400 flex items-center justify-center shrink-0 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedAssociation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-bright-blue">
                    {selectedAssociation.type === 'division'
                      ? (isBn ? 'বিভাগীয় সমিতি' : 'Division Association')
                      : (isBn ? 'জেলা সমিতি' : 'District Association')}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {isBn ? selectedAssociation.name_bn : selectedAssociation.name_en}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedAssociation(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {selectedAssociation.contacts && selectedAssociation.contacts.length > 0 ? (
                  selectedAssociation.contacts.map((contact) => {
                    const roleLabel =
                      contact.role === 'secretary'
                        ? (isBn ? 'সভাপতি / আহ্বায়ক (Secretary)' : 'President / Secretary')
                        : contact.role === 'general_secretary'
                        ? (isBn ? 'সাধারণ সম্পাদক (General Secretary)' : 'General Secretary')
                        : (isBn ? 'প্রতিনিধি / ভলান্টিয়ার' : 'Representative / Volunteer');

                    const cleanWa = contact.whatsapp ? contact.whatsapp.replace(/[^0-9]/g, '') : null;
                    const waLink = cleanWa
                      ? `https://wa.me/${cleanWa.startsWith('880') ? cleanWa : cleanWa.startsWith('0') ? `88${cleanWa}` : cleanWa}`
                      : null;

                    return (
                      <div
                        key={contact.id}
                        className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-primary text-[10px] font-extrabold mb-1">
                              {roleLabel}
                            </span>
                            <h4 className="font-bold text-sm sm:text-base text-slate-900">
                              {contact.name}
                            </h4>
                            <p className="font-mono text-xs sm:text-sm font-bold text-slate-700 mt-0.5">
                              {contact.phone}
                            </p>
                          </div>

                          {contact.available_time && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 font-mono shrink-0">
                              <Clock className="w-3 h-3 text-primary" />
                              <span>{contact.available_time}</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <a
                            href={`tel:${contact.phone}`}
                            className="min-h-[44px] py-2.5 px-3 rounded-xl bg-primary hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{isBn ? 'কল করুন' : 'Call'}</span>
                          </a>

                          {waLink ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              disabled
                              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-200 text-slate-400 font-bold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp নেই</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {isBn ? 'কোনো সক্রিয় প্রতিনিধি তালিকাভুক্ত নেই।' : 'No active contacts listed.'}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
                {isBn
                  ? 'প্রতিনিধিদের নম্বর কেবলমাত্র ভর্তি পরীক্ষা সংক্রান্ত জরুরি দিকনির্দেশনার জন্য ব্যবহারের অনুরোধ করা হলো।'
                  : 'Representative contact numbers are provided strictly for admission-related candidate guidance.'}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpPage;