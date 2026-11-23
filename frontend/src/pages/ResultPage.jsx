import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import {
  MapPin,
  Clock,
  Share2,
  Printer,
  AlertCircle,
  Navigation,
  ArrowLeft,
  Building,
  Phone,
  Mail,
  LocateFixed,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Timer
} from 'lucide-react';
import { searchSeat, getSiteSettings } from '../api';
import logoImg from '../assets/logo.png';
import centerFallbackImg from '../assets/center_placeholder.svg';
import MapView from '../components/MapView';

function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function format12Hour(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function computeLeaveBy(reportingTimeStr, travelMinutes) {
  if (!reportingTimeStr) return null;
  const parts = reportingTimeStr.split(':');
  const repHours = parseInt(parts[0], 10);
  const repMins = parseInt(parts[1], 10);
  let totalMins = repHours * 60 + repMins - travelMinutes;
  if (totalMins < 0) totalMins += 24 * 60;
  const leaveHours = Math.floor(totalMins / 60);
  const leaveMins = totalMins % 60;
  return format12Hour(`${String(leaveHours).padStart(2, '0')}:${String(leaveMins).padStart(2, '0')}`);
}

function enToBnDigits(str) {
  if (str === null || str === undefined) return '';
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
}

function bnToEnDigits(str) {
  if (str === null || str === undefined) return '';
  const bnToEnMap = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  return String(str).replace(/[০-৯]/g, (d) => bnToEnMap[d] || d);
}

function formatNumberByLang(val, isBn) {
  if (val === null || val === undefined) return '';
  return isBn ? enToBnDigits(val) : bnToEnDigits(val);
}

function formatDateByLang(dateStr, isBn) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month - 1, day);
    if (isNaN(d.getTime())) return dateStr;

    if (isBn) {
      const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
      const dayBn = enToBnDigits(day);
      const yearBn = enToBnDigits(year);
      return `${dayBn} ${bnMonths[d.getMonth()]}, ${yearBn}`;
    } else {
      const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${enMonths[d.getMonth()]} ${year}`;
    }
  } catch {
    return dateStr;
  }
}

const ResultPage = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isBn = i18n.language === 'bn';

  const [resultData, setResultData] = useState(() => {
    if (location.state?.resultData) {
      try {
        localStorage.setItem(
          'cou_last_searched_result',
          JSON.stringify({ data: location.state.resultData, timestamp: new Date().toISOString() })
        );
      } catch {}
      return location.state.resultData;
    }
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem('cou_last_searched_result');
        if (cached) return JSON.parse(cached).data;
      } catch {}
    }
    return null;
  });

  const [isOfflineSaved, setIsOfflineSaved] = useState(() => {
    if (!location.state?.resultData && !navigator.onLine) {
      return !!localStorage.getItem('cou_last_searched_result');
    }
    return false;
  });

  const [savedAtTimestamp, setSavedAtTimestamp] = useState(() => {
    try {
      const cached = localStorage.getItem('cou_last_searched_result');
      return cached ? JSON.parse(cached).timestamp : null;
    } catch {
      return null;
    }
  });

  const [notFound, setNotFound] = useState(location.state?.notFound || false);
  const [searchedRoll, setSearchedRoll] = useState(location.state?.searchedRoll || '');
  const [helpdesk, setHelpdesk] = useState(location.state?.helpdesk || null);
  const [loading, setLoading] = useState(false);

  const [geoState, setGeoState] = useState({
    locating: false,
    userLocation: null,
    distanceKm: null,
    etaMinutes: null,
    leaveByTime: null,
    error: null,
  });

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const rollFromParam = params.get('roll');

    if (!resultData && rollFromParam) {
      setLoading(true);
      setSearchedRoll(rollFromParam);
      searchSeat(rollFromParam)
        .then((res) => {
          if (res.data?.found) {
            setResultData(res.data);
            setNotFound(false);
            setIsOfflineSaved(false);
            try {
              localStorage.setItem(
                'cou_last_searched_result',
                JSON.stringify({ data: res.data, timestamp: new Date().toISOString() })
              );
              setSavedAtTimestamp(new Date().toISOString());
            } catch {}
          } else {
            setNotFound(true);
            setHelpdesk(res.data?.helpdesk || { phone: '+880 1711-223344', email: 'admission@cou.ac.bd' });
          }
        })
        .catch((err) => {
          try {
            const cached = localStorage.getItem('cou_last_searched_result');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed?.data && parsed.data.candidate?.roll === rollFromParam) {
                setResultData(parsed.data);
                setIsOfflineSaved(true);
                setSavedAtTimestamp(parsed.timestamp);
                setNotFound(false);
                return;
              }
            }
          } catch {}

          setNotFound(true);
          const errorHelpdesk = err.response?.data?.helpdesk || {
            phone: '+880 1711-223344',
            email: 'admission@cou.ac.bd',
          };
          setHelpdesk(errorHelpdesk);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [location.search, resultData]);

  useEffect(() => {
    if (!helpdesk) {
      getSiteSettings()
        .then((res) => {
          setHelpdesk({
            phone: res.data?.helpdesk_phone || '+880 1711-223344',
            email: res.data?.helpdesk_email || 'admission@cou.ac.bd',
          });
        })
        .catch(() => {
          setHelpdesk({ phone: '+880 1711-223344', email: 'admission@cou.ac.bd' });
        });
    }
  }, [helpdesk]);

  useEffect(() => {
    if (resultData?.candidate?.roll) {
      const shareUrl = `${window.location.origin}/result?roll=${resultData.candidate.roll}`;
      QRCode.toDataURL(shareUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0B3D91',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('QR generation error:', err));
    }
  }, [resultData]);

  const getExamCountdown = () => {
    if (!resultData?.seat?.exam_date) return null;
    try {
      const [year, month, day] = resultData.seat.exam_date.split('-').map(Number);
      const timeStr = resultData.seat.exam_time || '00:00';
      const [hours, minutes] = timeStr.split(':').map(Number);
      const examDateTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();

      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const examMidnight = new Date(year, month - 1, day).getTime();
      const diffDays = Math.round((examMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          text: isBn ? 'পরীক্ষা শেষ' : 'Exam ended',
        };
      }

      if (diffDays === 0) {
        const examEndEstimate = new Date(examDateTime.getTime() + 3 * 60 * 60 * 1000);
        if (now > examEndEstimate) {
          return {
            text: isBn ? 'পরীক্ষা শেষ' : 'Exam ended',
          };
        }
        return {
          text: isBn ? 'পরীক্ষা আজ' : 'Exam today',
        };
      }

      return {
        text: isBn
          ? `পরীক্ষার ${enToBnDigits(diffDays)} দিন বাকি`
          : `Exam in ${diffDays} day${diffDays > 1 ? 's' : ''}`,
      };
    } catch {
      return null;
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoState((prev) => ({
        ...prev,
        error: isBn ? 'আপনার ব্রাউজার জিওলোকেশন সমর্থন করে না।' : 'Geolocation not supported by your browser.',
      }));
      return;
    }

    setGeoState((prev) => ({ ...prev, locating: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const centerLat = parseFloat(resultData.center.latitude);
        const centerLng = parseFloat(resultData.center.longitude);

        const distKm = getHaversineDistanceKm(userLat, userLng, centerLat, centerLng);
        const travelMinutes = Math.round((distKm / 25) * 60) + 15;
        const leaveBy = computeLeaveBy(resultData.seat.reporting_time, travelMinutes);

        setGeoState({
          locating: false,
          userLocation: { latitude: userLat, longitude: userLng },
          distanceKm: distKm,
          etaMinutes: travelMinutes,
          leaveByTime: leaveBy,
          error: null,
        });

        showToast(isBn ? 'আপনার অবস্থান চিহ্নিত হয়েছে!' : 'Location retrieved successfully!');
      },
      (err) => {
        let msg = t('search.geo_denied');
        if (err.code === 2) msg = isBn ? 'অবস্থান পাওয়া যায়নি।' : 'Position unavailable.';
        if (err.code === 3) msg = isBn ? 'সময় শেষ হয়ে গেছে।' : 'Location request timed out.';
        setGeoState((prev) => ({
          ...prev,
          locating: false,
          error: msg,
        }));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleShare = () => {
    if (!resultData?.candidate || !resultData?.seat || !resultData?.center) return;
    const { candidate, seat, center } = resultData;
    const shareUrl = `${window.location.origin}/result?roll=${candidate.roll || ''}`;
    const shareText = `কুমিল্লা বিশ্ববিদ্যালয় ভর্তি পরীক্ষা সিট প্ল্যান:\nরোল: ${candidate.roll || ''}\nইউনিট: ${candidate.unit || ''}\nকেন্দ্র: ${isBn ? (center.name_bn || center.name_en) : (center.name_en || center.name_bn)}\nভবন: ${seat.building || ''}, কক্ষ: ${seat.room || ''}\nআসন নম্বর: ${seat.seat_no || ''}\nরিপোর্টিং সময়: ${seat.reporting_time || ''}\nডিরেকশন লিংক:`;

    if (navigator.share) {
      navigator
        .share({
          title: `Admission Seat: Roll ${candidate.roll}`,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      showToast(t('search.copied'));
    }
  };

  const handleSavePdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-semibold text-sm">{t('search.searching')}</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 md:py-12 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold font-mono mb-2">
              ROLL: {searchedRoll || 'N/A'}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">
              {t('search.not_found_title')}
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
              {isBn
                ? `ভর্তি পরীক্ষার রোল '${searchedRoll || ''}'-এর জন্য কোনো সিট পাওয়া যায়নি। অনুগ্রহ করে আপনার প্রবেশপত্রের রোল নম্বর পুনরায় যাচাই করুন অথবা ভর্তি হেল্পডেস্কে যোগাযোগ করুন।`
                : `No seat assignment was found for roll '${searchedRoll || ''}'. Please check your admit card roll number or contact the admission helpdesk.`}
            </p>
          </div>

          {helpdesk && (
            <div className="bg-sky-tint/80 border border-blue-100 p-4 rounded-2xl text-left text-xs md:text-sm text-slate-800 space-y-2.5">
              <p className="font-bold text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {t('search.helpdesk')}:
              </p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href={`tel:${helpdesk.phone}`} className="hover:underline font-mono font-semibold text-slate-900">
                  {helpdesk.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href={`mailto:${helpdesk.email}`} className="hover:underline font-medium text-slate-900 break-all">
                  {helpdesk.email}
                </a>
              </div>
            </div>
          )}

          <Link
            to="/home"
            className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-primary hover:bg-blue-900 text-white font-semibold transition-all shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('search.back_to_search')}</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const isValidResult = Boolean(
    resultData &&
    resultData.found !== false &&
    resultData.candidate &&
    resultData.seat &&
    resultData.center
  );

  if (!isValidResult) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-4">
          <p className="text-slate-600 text-sm">
            {isBn
              ? 'অনুগ্রহ করে প্রথমে আপনার রোল নম্বর দিয়ে সিট অনুসন্ধান করুন।'
              : 'Please enter your admission roll to find your seat plan.'}
          </p>
          <Link
            to="/home"
            className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] py-3 px-6 rounded-2xl bg-bright-blue hover:bg-blue-600 text-white font-bold text-sm shadow transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('search.back_to_search')}</span>
          </Link>
        </div>
      </div>
    );
  }

  const candidate = resultData?.candidate || {};
  const seat = resultData?.seat || {};
  const center = resultData?.center || {};
  const countdown = getExamCountdown();
  const directionsUrl = (center.latitude && center.longitude)
    ? `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((center.name_en || center.name_bn || 'Comilla University') + ' ' + (center.address || ''))}`;

  return (
    <div className="max-w-2xl mx-auto px-3.5 sm:px-4 py-4 md:py-8 space-y-5 pb-20">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700 pointer-events-none"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => navigate('/home')}
          className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold text-slate-600 hover:text-primary transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('search.back_to_search')}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-primary hover:border-primary shadow-sm text-xs font-semibold transition-all active:scale-95"
            title="Share"
          >
            <Share2 className="w-3.5 h-3.5 text-bright-blue" />
            <span className="hidden sm:inline">{t('search.share')}</span>
          </button>
          <button
            onClick={handleSavePdf}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary hover:bg-blue-900 text-white shadow-sm text-xs font-semibold transition-all active:scale-95"
            title="Save as PDF / Print"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('search.save_pdf')}</span>
          </button>
        </div>
      </div>

      {isOfflineSaved && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3 px-4 flex items-center justify-between text-xs font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>
              {isBn
                ? '💾 সংরক্ষিত অফলাইন রেজাল্ট (Saved Offline)'
                : '💾 Saved Offline Result'}
            </span>
          </div>
          {savedAtTimestamp && (
            <span className="font-mono text-[11px] text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-lg">
              {new Date(savedAtTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      )}

      <div className="space-y-4 seat-slip-container">
        <div className="hidden print:block border-b-2 border-primary pb-4 mb-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <img src={logoImg} alt="CoU Logo" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-xl font-bold text-primary font-serif">কুমিল্লা বিশ্ববিদ্যালয়</h1>
              <p className="text-xs text-slate-600">কেন্দ্রীয় ভর্তি পরীক্ষা আসন বিন্যাস স্লিপ</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[18px] p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-[104px] min-w-[104px] rounded-[20px] bg-[#0B3D91] py-2.5 px-2 flex flex-col items-center justify-center text-center shadow-md shadow-blue-950/20 shrink-0">
              <span className="text-[11px] font-medium text-white/80 uppercase tracking-wider leading-none">
                {isBn ? 'সিট' : 'Seat'}
              </span>
              <span className="font-sora font-extrabold text-white text-[38px] sm:text-[40px] leading-tight tracking-tight mt-0.5">
                {formatNumberByLang(seat.seat_no, isBn)}
              </span>
            </div>

            <div className="flex-1 min-w-0 py-0.5 space-y-1">
              <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 leading-snug">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{isBn ? 'আপনার সিট পাওয়া গেছে' : 'Your seat was found'}</span>
              </p>

              <h2 className="text-[19px] font-bold text-slate-900 dark:text-white leading-snug break-words">
                {candidate.name || (isBn ? 'নাম উপলব্ধ নেই' : 'Name not available')}
              </h2>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-normal">
                {isBn ? `ইউনিট: ${candidate.unit}` : `Unit: ${candidate.unit}`}
              </p>
            </div>
          </div>

          <div className="space-y-[6px] pt-3.5 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                {isBn ? 'রোল' : 'Roll'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-right">
                {candidate.roll}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                {isBn ? 'কেন্দ্র' : 'Center'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-right break-words max-w-[70%]">
                {isBn ? center.name_bn : center.name_en}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                {isBn ? 'ভবন' : 'Building'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-right break-words max-w-[70%]">
                {seat.building}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                {isBn ? 'কক্ষ' : 'Room'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-right font-mono">
                {formatNumberByLang(seat.room, isBn)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                {isBn ? 'তারিখ' : 'Date'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-right">
                {formatDateByLang(seat.exam_date, isBn)}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">
                {isBn ? 'সময়' : 'Time'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-right font-mono">
                {isBn
                  ? `${enToBnDigits(seat.exam_time)} (রিপোর্টিং: ${enToBnDigits(seat.reporting_time)})`
                  : `${seat.exam_time} (Reporting: ${seat.reporting_time})`}
              </span>
            </div>
          </div>

          {countdown && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-tint dark:bg-sky-950/70 text-primary dark:text-sky-300 border border-blue-100/80 dark:border-sky-900/60 text-xs font-bold leading-none">
                <Timer className="w-3.5 h-3.5 shrink-0" />
                <span>{countdown.text}</span>
              </span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[18px] p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  {t('search.center')} ({center.code})
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {isBn ? center.name_bn : center.name_en}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{center.address}</p>
              </div>
            </div>

            <div className="w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group bg-slate-100">
              <img
                src={center.photo_url || centerFallbackImg}
                alt={t('search.center_photo_alt')}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = centerFallbackImg;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-3">
                <span className="text-white text-xs font-semibold px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                  🚪 {t('search.gate')}: {center.gate_info || (isBn ? 'প্রধান গেট' : 'Main Gate')}
                </span>
              </div>
            </div>
          </div>

          {(center.instructions_bn || center.instructions_en) && (
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <strong className="text-slate-800 dark:text-slate-200">
                {isBn ? 'দিকনির্দেশনা:' : 'Instructions:'}{' '}
              </strong>
              {isBn
                ? center.instructions_bn || center.instructions_en
                : center.instructions_en || center.instructions_bn}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {isBn ? 'ম্যাপে পরীক্ষাকেন্দ্র' : 'Center on Map'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {center.latitude}, {center.longitude}
              </span>
            </div>

            <MapView
              center={center}
              userLocation={geoState.userLocation}
              isBn={isBn}
            />

            {geoState.distanceKm !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs md:text-sm text-emerald-950 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between font-bold border-b border-emerald-200/60 pb-1.5">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {t('search.route_info')}
                  </span>
                  <span className="font-mono text-emerald-800">{geoState.distanceKm} km</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-1">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      {t('search.eta')}
                    </span>
                    <span className="text-base font-extrabold text-emerald-900 font-mono">
                      ~{geoState.etaMinutes} {isBn ? 'মিনিট' : 'mins'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      {t('search.leave_by')}
                    </span>
                    <span className="text-base font-extrabold text-amber-700 font-mono">
                      {geoState.leaveByTime || '--:--'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 text-center">
                  {t('search.leave_by_sub')} ({format12Hour(seat.reporting_time)})
                </p>
              </motion.div>
            )}

            {geoState.error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center">
                {geoState.error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 no-print">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] py-3.5 px-4 rounded-2xl bg-bright-blue hover:bg-blue-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-800/15 transition-all flex items-center justify-center gap-2 active:scale-95 text-center"
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span>{t('search.get_directions')}</span>
              </a>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoState.locating}
                className="min-h-[48px] py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
              >
                <LocateFixed className={`w-4 h-4 shrink-0 ${geoState.locating ? 'animate-spin' : ''}`} />
                <span>{geoState.locating ? t('search.locating') : t('search.use_my_location')}</span>
              </button>
            </div>
          </div>

          {qrCodeDataUrl && (
            <div className="border-t border-slate-100 pt-5 flex flex-col sm:flex-row items-center gap-4 bg-sky-tint/40 p-4 rounded-2xl">
              <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200 shrink-0">
                <img
                  src={qrCodeDataUrl}
                  alt="Seat QR Code"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  {t('search.qr_title')}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  {t('search.qr_desc')}
                </p>
                <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/result?roll=${candidate.roll}`);
                      showToast(t('search.copied'));
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-bright-blue hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isBn ? 'লিংক কপি করুন' : 'Copy Result Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="hidden print:block pt-6 border-t border-slate-200 text-center text-xs text-slate-500 space-y-1">
            <p>
              প্রবেশপত্র ও এই আসন বিন্যাস স্লিপের নির্দেশাবলী মেনে নির্ধারিত রিপোর্টিং সময়ের পূর্বে পরীক্ষাকেন্দ্রে উপস্থিত থাকুন।
            </p>
            <p className="font-mono text-[10px]">
              যাচাইকরণ লিংক: {window.location.origin}/result?roll={candidate.roll} • CoU Admission 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;