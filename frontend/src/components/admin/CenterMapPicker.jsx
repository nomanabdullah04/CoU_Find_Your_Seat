import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const CenterMapPicker = ({ latitude, longitude, onLocationSelect }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const defaultLat = latitude ? parseFloat(latitude) : 23.41902;
  const defaultLng = longitude ? parseFloat(longitude) : 91.13783;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      scrollWheelZoom: false,
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          font-size: 16px;
        ">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
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
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([lat, lng]);
        }
      }
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-primary">ম্যাপে ক্লিক করে লোকেশন সিলেক্ট করুন:</span>
        <span className="font-mono">{latitude || defaultLat}, {longitude || defaultLng}</span>
      </div>
      <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default CenterMapPicker;

