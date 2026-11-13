import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, ArrowLeft, Building2, Compass } from 'lucide-react';
import { getCenterDetail } from '../api';

const MapPage = () => {
  const { centerId } = useParams();
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';

  const [center, setCenter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (centerId) {
      getCenterDetail(centerId)
        .then((res) => setCenter(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [centerId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-500">
        ম্যাপ ও কেন্দ্র লোড হচ্ছে...
      </div>
    );
  }

  if (!center) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-slate-500 mb-4">কেন্দ্রের তথ্য পাওয়া যায়নি।</p>
        <Link to="/home" className="text-primary font-bold hover:underline">
          হোমে ফিরে যান
        </Link>
      </div>
    );
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${center.latitude},${center.longitude}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <Link
        to="/home"
        className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-600 hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>ফিরে যান</span>
      </Link>

      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase">পরীক্ষার কেন্দ্র</span>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            {isBn ? center.name_bn : center.name_en}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <span>{center.address}</span>
          </p>
        </div>

        {/* Embedded Map / Iframe View */}
        <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
          <iframe
            title="Center Map"
            width="100%"
            height="100%"
            frameBorder="0"
            src={`https://maps.google.com/maps?q=${center.latitude},${center.longitude}&z=16&output=embed`}
            className="w-full h-full"
            loading="lazy"
          />
        </div>

        {/* Indoor Guide & Gate Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span>প্রবেশ গেট</span>
            </span>
            <p className="font-semibold text-slate-800 text-sm mt-1">{center.gate_info || 'প্রধান গেট'}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span>কেন্দ্রের কোড</span>
            </span>
            <p className="font-semibold text-slate-800 text-sm mt-1">{center.code}</p>
          </div>
        </div>

        {/* Walking Directions */}
        {(center.instructions_bn || center.instructions_en) && (
          <div className="bg-sky-tint/60 p-4 rounded-2xl border border-sky-100 text-xs md:text-sm text-slate-800">
            <span className="font-bold text-primary block mb-1">ক্যাম্পাস বা কেন্দ্রের অভ্যন্তরীণ পথনির্দেশ:</span>
            <p>{isBn ? (center.instructions_bn || center.instructions_en) : (center.instructions_en || center.instructions_bn)}</p>
          </div>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-6 rounded-2xl bg-bright-blue hover:bg-blue-600 text-white font-bold text-sm md:text-base shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Navigation className="w-5 h-5" />
          <span>গুগল ম্যাপে সরাসরি নেভিগেশন শুরু করুন</span>
        </a>
      </div>
    </div>
  );
};

export default MapPage;

