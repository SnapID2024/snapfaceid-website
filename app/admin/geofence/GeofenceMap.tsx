'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StateRegion {
  code: string;
  name: string;
  enabled: boolean;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  states: StateRegion[];
}

interface GeofenceMapProps {
  country: Country | null;
  onStateClick: (stateCode: string) => void;
}

// Country center coordinates and zoom levels
const COUNTRY_VIEWS: Record<string, { center: [number, number]; zoom: number }> = {
  US: { center: [39.8283, -98.5795], zoom: 4 },
  MX: { center: [23.6345, -102.5528], zoom: 5 },
  CA: { center: [56.1304, -106.3468], zoom: 3 },
  AR: { center: [-38.4161, -63.6167], zoom: 4 },
  BR: { center: [-14.2350, -51.9253], zoom: 4 },
  CO: { center: [4.5709, -74.2973], zoom: 5 },
  ES: { center: [40.4637, -3.7492], zoom: 5 },
  DE: { center: [51.1657, 10.4515], zoom: 5 },
  FR: { center: [46.2276, 2.2137], zoom: 5 },
  GB: { center: [55.3781, -3.4360], zoom: 5 },
  IT: { center: [41.8719, 12.5674], zoom: 5 },
  RU: { center: [61.5240, 105.3188], zoom: 3 },
  AU: { center: [-25.2744, 133.7751], zoom: 4 },
  JP: { center: [36.2048, 138.2529], zoom: 5 },
  CN: { center: [35.8617, 104.1954], zoom: 4 },
};

// US State boundaries (simplified coordinates for demonstration)
// In production, you would load GeoJSON data for accurate boundaries
const US_STATE_CENTERS: Record<string, [number, number]> = {
  AL: [32.3182, -86.9023], AK: [64.2008, -152.4937], AZ: [34.0489, -111.0937],
  AR: [34.7465, -92.2896], CA: [36.7783, -119.4179], CO: [39.5501, -105.7821],
  CT: [41.6032, -73.0877], DE: [38.9108, -75.5277], FL: [27.9944, -81.7603],
  GA: [32.1574, -82.9071], HI: [19.8968, -155.5828], ID: [44.0682, -114.7420],
  IL: [40.6331, -89.3985], IN: [40.2672, -86.1349], IA: [41.8780, -93.0977],
  KS: [39.0119, -98.4842], KY: [37.8393, -84.2700], LA: [30.9843, -91.9623],
  ME: [45.2538, -69.4455], MD: [39.0458, -76.6413], MA: [42.4072, -71.3824],
  MI: [44.3148, -85.6024], MN: [46.7296, -94.6859], MS: [32.3547, -89.3985],
  MO: [37.9643, -91.8318], MT: [46.8797, -110.3626], NE: [41.4925, -99.9018],
  NV: [38.8026, -116.4194], NH: [43.1939, -71.5724], NJ: [40.0583, -74.4057],
  NM: [34.5199, -105.8701], NY: [43.2994, -74.2179], NC: [35.7596, -79.0193],
  ND: [47.5515, -101.0020], OH: [40.4173, -82.9071], OK: [35.0078, -97.0929],
  OR: [43.8041, -120.5542], PA: [41.2033, -77.1945], RI: [41.5801, -71.4774],
  SC: [33.8361, -81.1637], SD: [43.9695, -99.9018], TN: [35.5175, -86.5804],
  TX: [31.9686, -99.9018], UT: [39.3210, -111.0937], VT: [44.5588, -72.5778],
  VA: [37.4316, -78.6569], WA: [47.7511, -120.7401], WV: [38.5976, -80.4549],
  WI: [43.7844, -88.7879], WY: [43.0760, -107.2903], DC: [38.9072, -77.0369],
  PR: [18.2208, -66.5901],
};

export default function GeofenceMap({ country, onStateClick }: GeofenceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize map if not already initialized
    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([39.8283, -98.5795], 4);

      // Add tile layer (grayscale style)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map when country changes
  useEffect(() => {
    if (!mapRef.current || !country) return;

    const map = mapRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Set view for the selected country
    const view = COUNTRY_VIEWS[country.code];
    if (view) {
      map.setView(view.center, view.zoom);
    }

    // Add markers for US states (the main use case)
    if (country.code === 'US') {
      country.states.forEach(state => {
        const coords = US_STATE_CENTERS[state.code];
        if (coords) {
          const marker = L.circleMarker(coords, {
            radius: 20,
            fillColor: state.enabled ? '#22c55e' : '#9ca3af',
            color: state.enabled ? '#16a34a' : '#6b7280',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7,
          });

          marker.bindTooltip(`
            <div class="text-center">
              <strong>${state.name}</strong><br/>
              <span class="${state.enabled ? 'text-green-600' : 'text-gray-500'}">
                ${state.enabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
          `, {
            permanent: false,
            direction: 'top',
            className: 'geofence-tooltip',
          });

          marker.on('click', () => {
            onStateClick(state.code);
          });

          marker.addTo(map);
          markersRef.current.push(marker);
        }
      });
    } else {
      // For other countries, show a simple representation
      // In production, you would load actual GeoJSON boundaries
      const view = COUNTRY_VIEWS[country.code];
      if (view) {
        country.states.forEach((state, index) => {
          // Distribute markers in a grid pattern around the country center
          const rows = Math.ceil(Math.sqrt(country.states.length));
          const cols = Math.ceil(country.states.length / rows);
          const row = Math.floor(index / cols);
          const col = index % cols;

          const offsetLat = (row - rows / 2) * 2;
          const offsetLng = (col - cols / 2) * 3;

          const coords: [number, number] = [
            view.center[0] + offsetLat,
            view.center[1] + offsetLng,
          ];

          const marker = L.circleMarker(coords, {
            radius: 15,
            fillColor: state.enabled ? '#22c55e' : '#9ca3af',
            color: state.enabled ? '#16a34a' : '#6b7280',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7,
          });

          marker.bindTooltip(`
            <div class="text-center">
              <strong>${state.name}</strong><br/>
              <span class="${state.enabled ? 'text-green-600' : 'text-gray-500'}">
                ${state.enabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
          `, {
            permanent: false,
            direction: 'top',
          });

          marker.on('click', () => {
            onStateClick(state.code);
          });

          marker.addTo(map);
          markersRef.current.push(marker);
        });
      }
    }
  }, [country, onStateClick]);

  // Update marker colors when state enabled status changes
  useEffect(() => {
    if (!country) return;

    markersRef.current.forEach((marker, index) => {
      const state = country.states[index];
      if (state) {
        marker.setStyle({
          fillColor: state.enabled ? '#22c55e' : '#9ca3af',
          color: state.enabled ? '#16a34a' : '#6b7280',
        });
      }
    });
  }, [country?.states]);

  if (!country) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Select a country to view the map</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full" style={{ minHeight: '400px' }} />
  );
}
