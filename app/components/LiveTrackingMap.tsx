'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  source?: string;
}

interface LiveTrackingMapProps {
  locations: LocationPoint[];
  userName?: string;
  status?: 'emergency' | 'panic' | 'safe';
  isLoading?: boolean;
  lastUpdated?: string;
}

// Format timestamp for display
const formatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
};

// Calculate time ago
const timeAgo = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  } catch {
    return '';
  }
};

// Create custom marker icon
const createMarkerIcon = (type: 'start' | 'latest' | 'point', status?: string) => {
  const colors = {
    start: '#6B7280',    // Gray
    latest: status === 'panic' ? '#EAB308' : '#DC2626', // Yellow for panic, Red for emergency
    point: '#9333EA',    // Purple
  };

  const color = colors[type];
  const size = type === 'latest' ? 24 : type === 'start' ? 18 : 12;
  const pulse = type === 'latest' ? 'animation: pulse 1.5s infinite;' : '';

  return L.divIcon({
    className: 'custom-tracking-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ${pulse}
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export default function LiveTrackingMap({
  locations,
  userName = 'User',
  status = 'emergency',
  isLoading = false,
  lastUpdated,
}: LiveTrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 19,
      minZoom: 2,
    }).setView([25.7617, -80.1918], 15);

    // CartoDB Positron - clean white/minimal style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
    }).addTo(map);

    // Add zoom control on right
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    // Add custom CSS for pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        50% { transform: scale(1.2); box-shadow: 0 4px 16px rgba(220,38,38,0.5); }
        100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
      }
      .custom-tracking-marker {
        background: transparent;
        border: none;
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

  // Update markers and trail when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (locations.length === 0) return;

    // Sort locations by timestamp (oldest first)
    const sortedLocations = [...locations].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Create polyline coordinates
    const latLngs: [number, number][] = sortedLocations.map(loc => [loc.latitude, loc.longitude]);

    // Draw trail polyline
    if (latLngs.length > 1) {
      polylineRef.current = L.polyline(latLngs, {
        color: '#9333EA', // Purple
        weight: 4,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    }

    // Add start marker (first location)
    const startLoc = sortedLocations[0];
    const startMarker = L.marker(
      [startLoc.latitude, startLoc.longitude],
      { icon: createMarkerIcon('start', status) }
    ).addTo(map);
    startMarker.bindPopup(`
      <div style="text-align: center; min-width: 120px;">
        <div style="font-weight: 600; color: #6B7280;">Start Location</div>
        <div style="font-size: 12px; color: #9CA3AF; margin-top: 4px;">${formatTime(startLoc.timestamp)}</div>
      </div>
    `);
    markersRef.current.push(startMarker);

    // Add latest marker (last location)
    const latestLoc = sortedLocations[sortedLocations.length - 1];
    if (sortedLocations.length > 1) {
      const latestMarker = L.marker(
        [latestLoc.latitude, latestLoc.longitude],
        { icon: createMarkerIcon('latest', status) }
      ).addTo(map);
      latestMarker.bindPopup(`
        <div style="text-align: center; min-width: 140px;">
          <div style="font-weight: 600; color: ${status === 'panic' ? '#CA8A04' : '#DC2626'};">${userName}</div>
          <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">Latest Location</div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">${formatTime(latestLoc.timestamp)}</div>
          <div style="font-size: 11px; color: #9CA3AF;">${timeAgo(latestLoc.timestamp)}</div>
        </div>
      `);
      markersRef.current.push(latestMarker);
    }

    // Center map - only ONE zoom operation to avoid dizziness effect
    if (latLngs.length > 1 && polylineRef.current) {
      // Multiple points: fit bounds to show the entire trail
      const bounds = polylineRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: false });
      }
    } else {
      // Single point: center on that location
      map.setView([latestLoc.latitude, latestLoc.longitude], 16, { animate: false });
    }

  }, [locations, mapReady, userName, status]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-xl" style={{ minHeight: '400px' }} />

      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[1000] flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'safe' ? 'bg-blue-500' : 'bg-red-500 animate-pulse'}`} />
        <span className="text-xs font-medium text-gray-700">
          {status === 'safe' ? 'Session Ended' : 'Live Tracking'}
        </span>
        {lastUpdated && (
          <span className="text-xs text-gray-500 ml-1">
            ({timeAgo(lastUpdated)})
          </span>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[1001] rounded-xl">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-gray-600 text-sm">Loading location data...</span>
          </div>
        </div>
      )}

      {/* No data message */}
      {!isLoading && locations.length === 0 && (
        <div className="absolute inset-0 bg-gray-50/90 backdrop-blur-sm flex items-center justify-center z-[1001] rounded-xl">
          <div className="text-center p-6">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-600 font-medium">No location data yet</p>
            <p className="text-gray-500 text-sm mt-1">Waiting for device to send location updates...</p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <div className="text-xs font-semibold text-gray-700 mb-2">Legend</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500" />
            <span className="text-xs text-gray-600">Start point</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status === 'panic' ? 'bg-yellow-500' : 'bg-red-600'} animate-pulse`} />
            <span className="text-xs text-gray-600">Current location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 bg-purple-600 rounded" />
            <span className="text-xs text-gray-600">Movement trail</span>
          </div>
        </div>
      </div>

      {/* Location count */}
      {locations.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[1000]">
          <span className="text-xs text-gray-600">{locations.length} location points</span>
        </div>
      )}
    </div>
  );
}
