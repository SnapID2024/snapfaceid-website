'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  originAddress?: string;
}

// Constants
const MOVEMENT_THRESHOLD_METERS = 5; // 5 meters - low threshold to show trail more often
const MAX_SNAP_DISTANCE_METERS = 50; // Max distance from road to be considered "on road"

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

// Calculate distance between two coordinates in meters using Haversine formula
const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Filter locations by movement
const filterLocationsByMovement = (
  locations: LocationPoint[],
  thresholdMeters: number
): { filtered: LocationPoint[]; hasSignificantMovement: boolean } => {
  if (locations.length === 0) {
    return { filtered: [], hasSignificantMovement: false };
  }

  const sorted = [...locations].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const origin = sorted[0];
  const filtered: LocationPoint[] = [origin];
  let hasSignificantMovement = false;
  let lastSignificantPoint = origin;

  for (let i = 1; i < sorted.length; i++) {
    const point = sorted[i];
    const distanceFromOrigin = calculateDistance(
      origin.latitude, origin.longitude,
      point.latitude, point.longitude
    );

    if (distanceFromOrigin > thresholdMeters) {
      hasSignificantMovement = true;
      const distanceFromLast = calculateDistance(
        lastSignificantPoint.latitude, lastSignificantPoint.longitude,
        point.latitude, point.longitude
      );

      if (distanceFromLast > thresholdMeters / 2) {
        filtered.push(point);
        lastSignificantPoint = point;
      }
    }
  }

  const latestPoint = sorted[sorted.length - 1];
  if (hasSignificantMovement && filtered[filtered.length - 1] !== latestPoint) {
    filtered.push(latestPoint);
  }

  return { filtered, hasSignificantMovement };
};

// Create custom marker icon
const createMarkerIcon = (type: 'start' | 'latest' | 'point', status?: string) => {
  const colors = {
    start: '#6B7280',
    latest: status === 'panic' ? '#EAB308' : '#DC2626',
    point: '#9333EA',
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

// Interface for road segments
interface RoadSegment {
  points: [number, number][];
  isOnRoad: boolean;
}

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
  const polylinesRef = useRef<L.Polyline[]>([]);
  const [mapReady, setMapReady] = useState(false);

  // Manual zoom control states
  const [isManualZoom, setIsManualZoom] = useState(false);
  const isUserInteractingRef = useRef(false);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Road segments state
  const [roadSegments, setRoadSegments] = useState<RoadSegment[]>([]);
  const [isProcessingRoads, setIsProcessingRoads] = useState(false);
  const lastProcessedLocationsRef = useRef<string>('');

  // Filter locations by movement
  const { filtered: filteredLocations, hasSignificantMovement } = filterLocationsByMovement(
    locations,
    MOVEMENT_THRESHOLD_METERS
  );

  // Snap to roads and create segments
  const processRoadSegments = useCallback(async (points: [number, number][]): Promise<RoadSegment[]> => {
    if (points.length < 2) return [];

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      // No API key - return single segment with all points as "on road" (purple trail)
      return [{ points, isOnRoad: true }];
    }

    try {
      // Google Roads API limit is 100 points
      const maxPoints = 100;
      const sampledPoints = points.length > maxPoints
        ? points.filter((_, i) => i % Math.ceil(points.length / maxPoints) === 0 || i === points.length - 1)
        : points;

      const path = sampledPoints.map(p => `${p[0]},${p[1]}`).join('|');

      const response = await fetch(
        `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=false&key=${apiKey}`
      );

      if (!response.ok) {
        // API error - default to purple trail
        return [{ points, isOnRoad: true }];
      }

      const data = await response.json();

      if (!data.snappedPoints || data.snappedPoints.length === 0) {
        // No road data available - default to purple trail
        return [{ points, isOnRoad: true }];
      }

      // Build a map of originalIndex -> snappedLocation
      const snappedMap = new Map<number, [number, number]>();

      for (const sp of data.snappedPoints) {
        const idx = sp.originalIndex;
        const snappedLat = sp.location.latitude;
        const snappedLng = sp.location.longitude;
        const originalLat = sampledPoints[idx][0];
        const originalLng = sampledPoints[idx][1];

        // Check if snapped point is close enough to original (within MAX_SNAP_DISTANCE_METERS)
        const distance = calculateDistance(originalLat, originalLng, snappedLat, snappedLng);

        if (distance <= MAX_SNAP_DISTANCE_METERS) {
          snappedMap.set(idx, [snappedLat, snappedLng]);
        }
      }

      // Build segments: consecutive points that are both on roads form a road segment
      const segments: RoadSegment[] = [];
      let currentSegment: RoadSegment | null = null;

      for (let i = 0; i < sampledPoints.length; i++) {
        const isOnRoad = snappedMap.has(i);
        const pointToUse: [number, number] = isOnRoad ? snappedMap.get(i)! : sampledPoints[i];

        if (currentSegment === null) {
          // Start a new segment
          currentSegment = { points: [pointToUse], isOnRoad };
        } else if (currentSegment.isOnRoad === isOnRoad) {
          // Continue current segment
          currentSegment.points.push(pointToUse);
        } else {
          // Segment type changed - save current and start new
          // Add connecting point to both segments for continuity
          if (currentSegment.points.length > 0) {
            segments.push(currentSegment);
          }
          currentSegment = { points: [pointToUse], isOnRoad };
        }
      }

      // Don't forget the last segment
      if (currentSegment && currentSegment.points.length > 0) {
        segments.push(currentSegment);
      }

      return segments;
    } catch (error) {
      console.warn('Error processing road segments:', error);
      // Error occurred - default to purple trail
      return [{ points, isOnRoad: true }];
    }
  }, []);

  // Handle auto view button click
  const handleAutoView = useCallback(() => {
    setIsManualZoom(false);

    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (polylinesRef.current.length > 0) {
      const allBounds = L.latLngBounds([]);
      polylinesRef.current.forEach(pl => {
        const bounds = pl.getBounds();
        if (bounds.isValid()) {
          allBounds.extend(bounds);
        }
      });
      if (allBounds.isValid()) {
        map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 17, animate: true });
      }
    } else if (filteredLocations.length > 0) {
      const latestLoc = filteredLocations[filteredLocations.length - 1];
      map.setView([latestLoc.latitude, latestLoc.longitude], 16, { animate: true });
    }
  }, [filteredLocations]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      maxZoom: 19,
      minZoom: 2,
    }).setView([25.7617, -80.1918], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const handleInteractionStart = () => {
      isUserInteractingRef.current = true;
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
    };

    const handleInteractionEnd = () => {
      interactionTimeoutRef.current = setTimeout(() => {
        if (isUserInteractingRef.current) {
          setIsManualZoom(true);
          isUserInteractingRef.current = false;
        }
      }, 100);
    };

    map.on('zoomstart', handleInteractionStart);
    map.on('dragstart', handleInteractionStart);
    map.on('zoomend', handleInteractionEnd);
    map.on('dragend', handleInteractionEnd);

    mapInstanceRef.current = map;
    setMapReady(true);

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
      if (interactionTimeoutRef.current) {
        clearTimeout(interactionTimeoutRef.current);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Process road segments when locations change
  useEffect(() => {
    if (!hasSignificantMovement || filteredLocations.length < 2) {
      setRoadSegments([]);
      return;
    }

    const locationsKey = filteredLocations.map(l => `${l.latitude},${l.longitude}`).join('|');
    if (locationsKey === lastProcessedLocationsRef.current) {
      return;
    }

    const process = async () => {
      setIsProcessingRoads(true);
      const latLngs: [number, number][] = filteredLocations.map(loc => [loc.latitude, loc.longitude]);
      const segments = await processRoadSegments(latLngs);
      setRoadSegments(segments);
      lastProcessedLocationsRef.current = locationsKey;
      setIsProcessingRoads(false);
    };

    process();
  }, [filteredLocations, hasSignificantMovement, processRoadSegments]);

  // Update markers and trail when locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing polylines
    polylinesRef.current.forEach(pl => pl.remove());
    polylinesRef.current = [];

    if (filteredLocations.length === 0) return;

    const sortedLocations = [...filteredLocations].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Draw road segments
    if (roadSegments.length > 0) {
      roadSegments.forEach(segment => {
        if (segment.points.length > 1) {
          const polyline = L.polyline(segment.points, {
            color: segment.isOnRoad ? '#9333EA' : '#D1D5DB', // Purple for roads, light gray for off-road
            weight: segment.isOnRoad ? 5 : 2,
            opacity: segment.isOnRoad ? 0.9 : 0.5,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: segment.isOnRoad ? undefined : '5, 8', // Dashed for off-road
          }).addTo(map);
          polylinesRef.current.push(polyline);
        }
      });
    } else if (hasSignificantMovement) {
      // Fallback: draw purple line if no road segments processed yet
      const latLngs: [number, number][] = sortedLocations.map(loc => [loc.latitude, loc.longitude]);
      if (latLngs.length > 1) {
        const polyline = L.polyline(latLngs, {
          color: '#9333EA', // Purple - same as on-road color
          weight: 4,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
        polylinesRef.current.push(polyline);
      }
    } else if (locations.length > 1) {
      // Even for minimal movement, show a light purple dashed trail using all raw locations
      const allLocationsSorted = [...locations].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const latLngs: [number, number][] = allLocationsSorted.map(loc => [loc.latitude, loc.longitude]);
      const polyline = L.polyline(latLngs, {
        color: '#A855F7', // Light purple
        weight: 3,
        opacity: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '5, 8',
      }).addTo(map);
      polylinesRef.current.push(polyline);
    }

    // Add start marker
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

    // Add latest marker
    const latestLoc = sortedLocations[sortedLocations.length - 1];
    if (sortedLocations.length > 1 || !hasSignificantMovement) {
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

    // Center map if not in manual zoom mode
    if (!isManualZoom) {
      if (polylinesRef.current.length > 0) {
        const allBounds = L.latLngBounds([]);
        polylinesRef.current.forEach(pl => {
          const bounds = pl.getBounds();
          if (bounds.isValid()) {
            allBounds.extend(bounds);
          }
        });
        if (allBounds.isValid()) {
          map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 17, animate: false });
        }
      } else {
        map.setView([latestLoc.latitude, latestLoc.longitude], 16, { animate: false });
      }
    }

  }, [filteredLocations, locations, mapReady, userName, status, isManualZoom, roadSegments, hasSignificantMovement]);

  const totalPoints = locations.length;
  const displayedPoints = filteredLocations.length;
  const filteredOut = totalPoints - displayedPoints;

  // Check if we have any road segments
  const hasRoadSegments = roadSegments.some(s => s.isOnRoad && s.points.length > 1);

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
        {isProcessingRoads && (
          <span className="text-xs text-purple-500 ml-1">(mapping...)</span>
        )}
      </div>

      {/* Auto View Button */}
      {isManualZoom && filteredLocations.length > 0 && (
        <div className="absolute top-4 right-16 z-[1000]">
          <button
            onClick={handleAutoView}
            className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 hover:bg-white transition-colors border border-gray-200"
            title="Show full trail"
          >
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Auto View</span>
          </button>
        </div>
      )}

      {/* Manual zoom indicator */}
      {isManualZoom && (
        <div className="absolute top-14 left-4 bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 shadow-sm z-[1000]">
          <span className="text-xs text-yellow-700">Manual zoom active</span>
        </div>
      )}

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
          {hasSignificantMovement && (
            <>
              {hasRoadSegments && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-1 bg-purple-600 rounded" />
                  <span className="text-xs text-gray-600">On road</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-gray-300 rounded" style={{ borderStyle: 'dashed' }} />
                <span className="text-xs text-gray-600">Off road / park</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Location count */}
      {locations.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-[1000]">
          <div className="text-xs text-gray-600">
            {hasSignificantMovement ? (
              <>
                <span className="font-medium">{displayedPoints}</span> trail points
                {filteredOut > 0 && (
                  <span className="text-gray-400 ml-1">({totalPoints} total)</span>
                )}
              </>
            ) : (
              <>{totalPoints} location updates (stationary)</>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
