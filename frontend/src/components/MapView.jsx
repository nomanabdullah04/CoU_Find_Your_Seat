import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const MapView = ({ center, userLocation, isBn }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const userMarkerRef = useRef(null);

  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  useEffect(() => {
    // If Google Maps key is set, we don't initialize Leaflet
    if (googleMapsKey) return;
    if (!mapContainerRef.current) return;
    if (!center || !center.latitude || !center.longitude) return;

    const lat = parseFloat(center.latitude);
    const lng = parseFloat(center.longitude);

    // Clean up existing map instance if already initialized
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true,
      scrollWheelZoom: false,
    });
    mapInstanceRef.current = map;

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Custom Center Pin Icon
    const centerIcon = L.divIcon({
      className: 'custom-center-pin',
      html: `
        <div style="
          background: linear-gradient(135deg, #0B3D91 0%, #1E6FEB 100%);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 10px rgba(11,61,145,0.4);
        ">
          <span style="transform: rotate(45deg); font-size: 16px;">🏛️</span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -36],
    });

    const centerName = isBn ? (center.name_bn || center.name_en) : (center.name_en || center.name_bn);
    const marker = L.marker([lat, lng], { icon: centerIcon }).addTo(map);
    
    marker.bindPopup(`
      <div style="font-family: inherit; font-size: 13px; line-height: 1.4; color: #0F172A; min-width: 180px;">
        <strong style="color: #0B3D91; font-size: 14px; display: block; margin-bottom: 3px;">${centerName}</strong>
        <p style="margin: 0 0 4px 0; color: #64748B;">${center.address}</p>
        ${center.gate_info ? `<span style="background: #EAF2FF; color: #0B3D91; padding: 2px 8px; border-radius: 12px; font-weight: bold; font-size: 11px;">🚪 ${center.gate_info}</span>` : ''}
      </div>
    `).openPopup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, googleMapsKey, isBn]);

  // Update map when userLocation changes
  useEffect(() => {
    if (googleMapsKey || !mapInstanceRef.current || !userLocation || !center) return;

    const map = mapInstanceRef.current;
    const centerLat = parseFloat(center.latitude);
    const centerLng = parseFloat(center.longitude);

    // Remove previous user marker and route
    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
    }
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }

    // User location icon
    const userIcon = L.divIcon({
      className: 'custom-user-pin',
      html: `
        <div style="
          background: #16A34A;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 8px rgba(22,163,74,0.4);
        ">
          <span style="font-size: 14px;">📍</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(isBn ? 'আপনার বর্তমান অবস্থান' : 'Your Current Location');
    userMarkerRef.current = userMarker;

    // Draw route line
    const routeLine = L.polyline(
      [
        [userLocation.latitude, userLocation.longitude],
        [centerLat, centerLng],
      ],
      {
        color: '#1E6FEB',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }
    ).addTo(map);
    routeLayerRef.current = routeLine;

    // Fit map view to cover both points
    const bounds = L.latLngBounds([
      [userLocation.latitude, userLocation.longitude],
      [centerLat, centerLng],
    ]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [userLocation, center, googleMapsKey, isBn]);

  if (!center || !center.latitude || !center.longitude) {
    return null;
  }

  // If Google Maps API key is configured, embed Google Maps
  if (googleMapsKey) {
    const lat = center.latitude;
    const lng = center.longitude;
    const googleMapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${googleMapsKey}&q=${lat},${lng}&zoom=16`;
    return (
      <div className="w-full h-72 md:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <iframe
          title="Google Map Center"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={googleMapEmbedUrl}
        />
      </div>
    );
  }

  // OpenStreetMap + Leaflet fallback
  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0">
      <div ref={mapContainerRef} className="w-full h-72 md:h-80 z-0" />
      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[10px] text-slate-600 px-2 py-0.5 rounded shadow z-[400] font-mono pointer-events-none">
        OpenStreetMap • CoU Seat Plan
      </div>
    </div>
  );
};

export default MapView;

