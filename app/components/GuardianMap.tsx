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
  centerTrigger?: number; // Timestamp para forzar centrado del mapa
}

// Calculate marker size based on zoom level
// At high zoom (close up): smaller icons to see buildings
// At low zoom (far away): not too big to avoid clutter with many users
const getMarkerSize = (zoom: number) => {
  // Zoom 17-21: 18-24px (small, to see building details)
  // Zoom 12-16: 24-28px (medium)
  // Zoom 2-11: 28px max (capped at ~50% of old max to handle many users)
  if (zoom >= 17) {
    return 18; // Very small at max zoom
  } else if (zoom >= 14) {
    return 22; // Small-medium
  } else if (zoom >= 10) {
    return 26; // Medium
  } else {
    return 28; // Max size capped (was 44, now ~50% smaller)
  }
};

// Custom marker icon for users
// Colors: Safe=Blue, Active=Green, Emergency=Red, No Response=Orange (pulsing)
const createUserIcon = (status: string, zoom: number = 15) => {
  const color = status === 'emergency' ? '#dc2626' :      // Red
                status === 'no_response' ? '#f97316' :    // Orange (pulsing)
                status === 'active' ? '#22c55e' :         // Green
                status === 'safe' ? '#3b82f6' : '#6b7280'; // Blue for safe, Gray for unknown

  const size = getMarkerSize(zoom);
  const iconSize = Math.round(size * 0.5);
  const borderWidth = Math.max(2, Math.round(size * 0.075));

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        ${status === 'emergency' || status === 'no_response' ? 'animation: pulse 1.5s infinite;' : ''}
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export default function GuardianMap({ selectedAlert, allAlerts, onAlertSelect, centerTrigger }: GuardianMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{marker: L.Marker, alert: Alert}[]>([]);
  const lastCenteredAlertRef = useRef<string | null>(null);
  const currentLayerRef = useRef<L.TileLayer | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayer, setActiveLayer] = useState<'google' | 'esri'>('google');
  const [currentZoom, setCurrentZoom] = useState(17);

  // Layer definitions
  const layers = {
    google: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      options: {
        maxZoom: 21,
        maxNativeZoom: 21,
        attribution: '© Google Maps'
      }
    },
    esri: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        maxNativeZoom: 19,
        attribution: '© ESRI'
      }
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 21,
      minZoom: 2,
    }).setView([25.7617, -80.1918], 17);

    // Start with Google Hybrid (satellite + labels)
    const initialLayer = L.tileLayer(layers.google.url, layers.google.options).addTo(map);
    currentLayerRef.current = initialLayer;

    // Add zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add attribution
    L.control.attribution({
      position: 'bottomright',
      prefix: false,
    }).addTo(map).addAttribution('© Google Maps');

    // Listen for zoom changes to update marker sizes
    map.on('zoomend', () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
    });

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

  // Switch layer function
  const switchLayer = (layerType: 'google' | 'esri') => {
    if (!mapInstanceRef.current || activeLayer === layerType) return;

    // Remove current layer
    if (currentLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentLayerRef.current);
    }

    // Add new layer
    const layerConfig = layers[layerType];
    const newLayer = L.tileLayer(layerConfig.url, layerConfig.options).addTo(mapInstanceRef.current);
    currentLayerRef.current = newLayer;

    // Adjust map max zoom based on layer
    mapInstanceRef.current.setMaxZoom(layerConfig.options.maxZoom);

    // If current zoom exceeds new max, adjust it
    if (mapInstanceRef.current.getZoom() > layerConfig.options.maxZoom) {
      mapInstanceRef.current.setZoom(layerConfig.options.maxZoom);
    }

    setActiveLayer(layerType);
  };

  // Helper function to check if coordinates are valid (not 0,0)
  const hasValidCoordinates = (location: Location | undefined) => {
    if (!location) return false;
    // (0,0) is in the Atlantic Ocean - treat as invalid
    return location.latitude !== 0 || location.longitude !== 0;
  };

  // Update markers when alerts or zoom change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(({marker}) => marker.remove());
    markersRef.current = [];

    const alertsToShow = allAlerts || (selectedAlert ? [selectedAlert] : []);

    // Filter alerts with valid coordinates for map markers
    const alertsWithCoords = alertsToShow.filter(a => hasValidCoordinates(a.currentLocation));

    alertsWithCoords.forEach(alert => {
      if (!alert.currentLocation) return;

      const marker = L.marker(
        [alert.currentLocation.latitude, alert.currentLocation.longitude],
        { icon: createUserIcon(alert.status, currentZoom) }
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
            background: ${alert.status === 'emergency' ? '#fee2e2' : alert.status === 'no_response' ? '#ffedd5' : alert.status === 'active' ? '#dcfce7' : '#dbeafe'};
            color: ${alert.status === 'emergency' ? '#dc2626' : alert.status === 'no_response' ? '#ea580c' : alert.status === 'active' ? '#16a34a' : '#2563eb'};
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

      markersRef.current.push({marker, alert});
    });

    // Default center (Miami, FL - where most users appear to be)
    const defaultCenter: [number, number] = [25.7617, -80.1918];

    // SIEMPRE centrar el mapa cuando hay una alerta seleccionada con coordenadas válidas
    // Esto permite que al hacer clic en una alerta (incluso la misma), el mapa vuelva a centrar
    if (selectedAlert && hasValidCoordinates(selectedAlert.currentLocation)) {
      // Centrar en la ubicación del usuario seleccionado
      mapInstanceRef.current.setView(
        [selectedAlert.currentLocation.latitude, selectedAlert.currentLocation.longitude],
        17, // Zoom 17 para ver edificios con detalle
        { animate: true }
      );
      lastCenteredAlertRef.current = selectedAlert.id;

      // Open the popup for selected alert
      const selectedMarkerData = markersRef.current.find(({alert}) => alert.id === selectedAlert.id);
      if (selectedMarkerData) {
        selectedMarkerData.marker.openPopup();
      }
    } else if (!selectedAlert && lastCenteredAlertRef.current === null) {
      // No hay selección y nunca hemos centrado - mostrar vista general
      if (alertsWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          alertsWithCoords.map(a => [a.currentLocation.latitude, a.currentLocation.longitude])
        );
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } else {
        mapInstanceRef.current.setView(defaultCenter, 12, { animate: true });
      }
    }

  }, [selectedAlert, allAlerts, mapReady, onAlertSelect, centerTrigger]);

  // Update marker icons when zoom changes (without recreating markers or changing view)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady || markersRef.current.length === 0) return;

    // Just update the icon of each marker based on current zoom
    markersRef.current.forEach(({marker, alert}) => {
      marker.setIcon(createUserIcon(alert.status, currentZoom));
    });
  }, [currentZoom, mapReady]);

  // Count alerts without valid coordinates
  const alertsToShow = allAlerts || (selectedAlert ? [selectedAlert] : []);
  const alertsWithoutCoords = alertsToShow.filter(a => !hasValidCoordinates(a.currentLocation));

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
            <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
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

      {/* Layer Selector */}
      <div className="absolute top-14 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg z-[1000] flex overflow-hidden">
        <button
          onClick={() => switchLayer('google')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeLayer === 'google'
              ? 'bg-[#6A1B9A] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Google
        </button>
        <button
          onClick={() => switchLayer('esri')}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            activeLayer === 'esri'
              ? 'bg-[#6A1B9A] text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          ESRI HD
        </button>
      </div>

      {/* Warning when alerts don't have GPS coordinates */}
      {alertsWithoutCoords.length > 0 && (
        <div className="absolute top-4 right-16 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 shadow-lg z-[1000] flex items-center gap-2 max-w-xs">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs text-amber-700">
            {alertsWithoutCoords.length} alert{alertsWithoutCoords.length > 1 ? 's' : ''} without GPS (see addresses in list)
          </span>
        </div>
      )}
    </div>
  );
}
