'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Location {
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface Alert {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userPhotoUrl: string;
  datePhotoUrl: string;
  dateName: string;
  datePhone: string;
  dateLocation: string;
  activatedAt: string;
  lastCheckIn: string;
  status: 'active' | 'no_response' | 'safe' | 'emergency';
  flyerUrl?: string;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
  currentLocation: Location;
}

interface GuardianMapProps {
  selectedAlert: Alert | null;
  allAlerts?: Alert[];
  onAlertSelect?: (alert: Alert) => void;
}

// Custom marker icon for users
const createUserIcon = (status: string) => {
  const color = status === 'emergency' ? '#dc2626' :
                status === 'no_response' ? '#ef4444' :
                status === 'active' ? '#22c55e' : '#3b82f6';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${status === 'emergency' || status === 'no_response' ? 'animation: pulse 1.5s infinite;' : ''}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

export default function GuardianMap({ selectedAlert, allAlerts, onAlertSelect }: GuardianMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Apple Maps-like style using CartoDB tiles
    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([37.7749, -122.4194], 12);

    // CartoDB Voyager - Clean Apple Maps-like style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control on the right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add subtle attribution
    L.control.attribution({
      position: 'bottomright',
      prefix: false,
    }).addTo(map).addAttribution('© OpenStreetMap');

    mapInstanceRef.current = map;
    setMapReady(true);

    // Add custom CSS for pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }
      .leaflet-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .leaflet-popup-content-wrapper {
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      }
      .leaflet-popup-content {
        margin: 12px 16px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when alerts change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const alertsToShow = allAlerts || (selectedAlert ? [selectedAlert] : []);

    alertsToShow.forEach(alert => {
      if (!alert.currentLocation) return;

      const marker = L.marker(
        [alert.currentLocation.latitude, alert.currentLocation.longitude],
        { icon: createUserIcon(alert.status) }
      ).addTo(mapInstanceRef.current!);

      // Create popup content
      const popupContent = `
        <div style="text-align: center; min-width: 150px;">
          <img src="${alert.userPhotoUrl || '/placeholder-user.png'}"
               alt="${alert.userName}"
               style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; margin: 0 auto 8px; border: 2px solid #6A1B9A;"
               onerror="this.src='/placeholder-user.png'"/>
          <div style="font-weight: 600; color: #1f2937;">${alert.userName}</div>
          <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${alert.dateLocation}</div>
          <div style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 8px;
            background: ${alert.status === 'emergency' ? '#fee2e2' : alert.status === 'no_response' ? '#fef2f2' : alert.status === 'active' ? '#dcfce7' : '#dbeafe'};
            color: ${alert.status === 'emergency' ? '#dc2626' : alert.status === 'no_response' ? '#ef4444' : alert.status === 'active' ? '#16a34a' : '#2563eb'};
          ">
            ${alert.status === 'no_response' ? 'NO RESPONSE' : alert.status.toUpperCase()}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'custom-popup',
      });

      if (onAlertSelect) {
        marker.on('click', () => onAlertSelect(alert));
      }

      markersRef.current.push(marker);
    });

    // If there's a selected alert, center on it
    if (selectedAlert?.currentLocation) {
      mapInstanceRef.current.setView(
        [selectedAlert.currentLocation.latitude, selectedAlert.currentLocation.longitude],
        15,
        { animate: true }
      );

      // Open the popup for selected alert
      const selectedMarker = markersRef.current.find((_, index) => {
        const alerts = allAlerts || [selectedAlert];
        return alerts[index]?.id === selectedAlert.id;
      });
      if (selectedMarker) {
        selectedMarker.openPopup();
      }
    } else if (alertsToShow.length > 0) {
      // Fit bounds to show all markers
      const bounds = L.latLngBounds(
        alertsToShow
          .filter(a => a.currentLocation)
          .map(a => [a.currentLocation.latitude, a.currentLocation.longitude])
      );
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [selectedAlert, allAlerts, mapReady, onAlertSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: '300px' }} />

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <div className="text-xs font-semibold text-gray-700 mb-2">Status</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-gray-600">No Response</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <span className="text-xs text-gray-600">Emergency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600">Safe</span>
          </div>
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[1000] flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-gray-700">Live Tracking</span>
      </div>
    </div>
  );
}
