import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, MapPin, Loader2, X, Navigation, Crosshair } from 'lucide-react';

const QUICK_LOCATIONS = [
  { name: 'কুবি ক্যাম্পাস', lat: 23.41902, lng: 91.13783, zoom: 16 },
  { name: 'কুমিল্লা শহর', lat: 23.4610, lng: 91.1810, zoom: 15 },
  { name: 'ঢাকা', lat: 23.7179, lng: 90.3842, zoom: 14 },
  { name: 'চট্টগ্রাম', lat: 22.3569, lng: 91.7832, zoom: 14 },
];

const CenterMapPicker = ({ latitude, longitude, onLocationSelect, suggestedQuery = '' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const defaultLat = latitude ? parseFloat(latitude) : 23.41902;
  const defaultLng = longitude ? parseFloat(longitude) : 91.13783;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [customCoords, setCustomCoords] = useState('');

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      scrollWheelZoom: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'picker-pin',
      html: `
        <div style="
          background: #0B3D91;
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.35);
          font-size: 17px;
          cursor: pointer;
        ">
          📍
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const marker = L.marker([defaultLat, defaultLng], { icon: pinIcon }).addTo(map);
    markerRef.current = marker;

    // Handle map click
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const roundedLat = parseFloat(lat.toFixed(6));
      const roundedLng = parseFloat(lng.toFixed(6));
      marker.setLatLng([roundedLat, roundedLng]);
      if (onLocationSelect) {
        onLocationSelect(roundedLat, roundedLng);
      }
      setShowDropdown(false);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when props change
  useEffect(() => {
    if (markerRef.current && latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [latitude, longitude]);

  // Jump to specific coordinate
  const jumpToLocation = (lat, lng, zoom = 16) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    
    if (markerRef.current) {
      markerRef.current.setLatLng([roundedLat, roundedLng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([roundedLat, roundedLng], zoom, {
        duration: 1.2,
      });
    }
    if (onLocationSelect) {
      onLocationSelect(roundedLat, roundedLng);
    }
  };

  // Search places via OpenStreetMap Nominatim API
  const handleSearch = async (e, queryParam) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const query = (queryParam || searchQuery).trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError('');
    setShowDropdown(true);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=bd&limit=5&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'bn,en',
        },
      });

      if (!response.ok) {
        throw new Error('নেটওয়ার্ক সমস্যা, পুনরায় চেষ্টা করুন।');
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        setSearchError(`'${query}' এর কোনো ফলাফল পাওয়া যায়নি। অন্য নাম বা এলাকা লিখুন।`);
        setSearchResults([]);
      } else {
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Nominatim Geocoding Error:', err);
      setSearchError('লোকেশন খুঁজতে সমস্যা হচ্ছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    jumpToLocation(lat, lng, 16);
    setSearchQuery(item.display_name.split(',')[0]);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleManualCoordsSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!customCoords.trim()) return;
    
    // Extract lat and lng from string e.g. "23.7179, 90.3842" or "23.7179 90.3842"
    const parts = customCoords.split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
    if (parts.length >= 2) {
      const lat = parts[0];
      const lng = parts[1];
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        jumpToLocation(lat, lng, 16);
        setCustomCoords('');
      } else {
        alert('সঠিক Latitude ও Longitude প্রদান করুন!');
      }
    } else {
      alert('কোঅর্ডিনেট ফরম্যাট: 23.7179, 90.3842');
    }
  };

  return (
    <div className="space-y-2">
      {/* Search Input Bar (Using div to avoid nesting inside parent form) */}
      <div className="relative">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearch();
                }
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              placeholder="🔍 কলেজের নাম বা এলাকা দিয়ে সার্চ করুন (যেমন: Dhaka College)..."
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-blue-200 bg-blue-50/40 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs text-slate-800 placeholder:text-slate-400 font-medium transition-all shadow-sm"
            />
            <Search className="w-4 h-4 text-primary absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowDropdown(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-3.5 py-2 bg-primary hover:bg-primary-hover active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 shrink-0"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>খুঁজুন</span>
          </button>
        </div>

        {/* Dropdown Suggestions */}
        {showDropdown && (searchResults.length > 0 || searchError) && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs max-h-56 overflow-y-auto divide-y divide-slate-100">
            {searchError ? (
              <div className="p-3 text-amber-700 bg-amber-50/50 flex items-center justify-between">
                <span>{searchError}</span>
                <button
                  type="button"
                  onClick={() => setShowDropdown(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              searchResults.map((item, idx) => {
                const title = item.display_name.split(',')[0];
                const subtitle = item.display_name.split(',').slice(1, 4).join(', ');
                return (
                  <button
                    key={item.place_id || idx}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left p-2.5 hover:bg-blue-50/70 transition-colors flex items-start gap-2.5 group"
                  >
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-800 truncate">{title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{subtitle}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Quick City Jump Shortcuts & Suggested Query */}
      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
        {suggestedQuery && suggestedQuery.trim().length > 2 && (
          <button
            type="button"
            onClick={() => {
              const q = suggestedQuery.trim();
              setSearchQuery(q);
              handleSearch(null, q);
            }}
            className="px-2 py-0.5 bg-blue-100 hover:bg-primary hover:text-white rounded-lg border border-blue-300 text-primary font-bold transition-all active:scale-95 flex items-center gap-1"
          >
            <span>🔍 "{suggestedQuery.trim().slice(0, 18)}{suggestedQuery.trim().length > 18 ? '...' : ''}" খুঁজুন</span>
          </button>
        )}
        <span className="text-slate-500 font-semibold flex items-center gap-1">
          <Crosshair className="w-3 h-3 text-slate-400" />
          কুইক জাম্প:
        </span>
        {QUICK_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            type="button"
            onClick={() => jumpToLocation(loc.lat, loc.lng, loc.zoom)}
            className="px-2 py-0.5 bg-slate-100 hover:bg-primary/10 hover:text-primary rounded-lg border border-slate-200/80 text-slate-600 font-medium transition-all active:scale-95"
          >
            {loc.name}
          </button>
        ))}
      </div>

      {/* Coordinates Display & Status */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
        <span className="font-semibold text-primary flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          ম্যাপে ক্লিক করে পিন বসান:
        </span>
        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-slate-700 text-[11px]">
          {latitude || defaultLat}, {longitude || defaultLng}
        </span>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="w-full h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Google Maps Coordinate Paste Helper (Using div to avoid nesting inside parent form) */}
      <div className="flex items-center gap-2 pt-0.5">
        <input
          type="text"
          value={customCoords}
          onChange={(e) => setCustomCoords(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.stopPropagation();
              handleManualCoordsSubmit();
            }
          }}
          placeholder="গুগল ম্যাপস কোঅর্ডিনেট পেস্ট করুন (যেমন: 23.7179, 90.3842)"
          className="flex-1 px-2.5 py-1 text-[11px] font-mono rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary text-slate-700 placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={handleManualCoordsSubmit}
          disabled={!customCoords.trim()}
          className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 active:scale-95 disabled:opacity-40 text-slate-700 rounded-lg text-[11px] font-semibold transition-all shrink-0"
        >
          সেট করুন
        </button>
      </div>
    </div>
  );
};

export default CenterMapPicker;
