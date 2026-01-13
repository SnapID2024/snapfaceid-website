'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map (client-side only)
const LiveTrackingMap = dynamic(() => import('@/app/components/LiveTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    </div>
  ),
});

// Internal format for LiveTrackingMap
interface LocationPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  source?: string;
}

// API response format (matches backend guardian.py)
interface ApiLocationPoint {
  lat: number;
  lng: number;
  ts: string;
  accuracy?: number;
  source?: string;
}

interface ApiTrackingData {
  success: boolean;
  session_id: string;
  status: 'emergency' | 'panic' | 'safe';
  alert_type: 'panic' | 'emergency';
  user_nickname?: string;
  current_location: {
    lat: number;
    lng: number;
    updated_at: string;
    source?: string;
  };
  location_info: {
    type?: string;
    address?: string;
  };
  activated_at: string;
  emergency_at?: string;
  panic_at?: string;
  safe_at?: string;
  locations: ApiLocationPoint[];
  locations_count: number;
  is_frozen: boolean;
}

// Transformed data for component use
interface TrackingData {
  session_id: string;
  user_name: string;
  status: 'emergency' | 'panic' | 'safe';
  started_at: string;
  safe_at?: string;
  location_history: LocationPoint[];
}

// Format time ago
const timeAgo = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } catch {
    return '';
  }
};

// Format date time
const formatDateTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
};

export default function PublicTrackingPage() {
  const params = useParams();
  const token = params.token as string;

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.snapfaceid.com';

  const fetchTrackingData = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/guardian/track/${token}`);

      if (response.status === 404) {
        setError('This tracking link has expired or is no longer valid.');
        setTrackingData(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tracking data: ${response.status}`);
      }

      const apiData: ApiTrackingData = await response.json();

      // Transform API response to internal format
      const transformedData: TrackingData = {
        session_id: apiData.session_id,
        user_name: apiData.user_nickname || 'User',
        status: apiData.status,
        started_at: apiData.activated_at,
        safe_at: apiData.safe_at,
        // Transform lat/lng/ts to latitude/longitude/timestamp
        location_history: (apiData.locations || [])
          .map(loc => ({
            latitude: loc.lat,
            longitude: loc.lng,
            timestamp: loc.ts,
            accuracy: loc.accuracy,
            source: loc.source,
          }))
          .filter(loc => typeof loc.latitude === 'number' && typeof loc.longitude === 'number' && !!loc.timestamp),
      };

      setTrackingData(transformedData);
      setLastFetched(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
      if (!trackingData) {
        setError('Unable to load tracking data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL, trackingData]);

  // Initial fetch
  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Polling every 10 seconds for live updates
  useEffect(() => {
    if (!token || error) return;

    const interval = setInterval(() => {
      fetchTrackingData();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [token, error, fetchTrackingData]);

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Tracking Unavailable</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-4">
            If you believe this is an error, please contact the person who sent you this link.
          </p>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading || !trackingData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Loading Tracking Data</h1>
          <p className="text-gray-600">Please wait while we fetch the location...</p>
        </div>
      </div>
    );
  }

  const isSessionEnded = trackingData.status === 'safe';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className={`${
        isSessionEnded ? 'bg-blue-600' : trackingData.status === 'panic' ? 'bg-yellow-500' : 'bg-red-600'
      } text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isSessionEnded && (
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
              )}
              <h1 className="text-lg font-bold">
                {isSessionEnded ? 'Session Ended Safely' : 'Emergency Live Tracking'}
              </h1>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
              isSessionEnded ? 'bg-blue-700' : trackingData.status === 'panic' ? 'bg-yellow-600' : 'bg-red-700'
            }`}>
              {trackingData.status === 'safe' ? 'SAFE' : trackingData.status === 'panic' ? 'PANIC' : 'EMERGENCY'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tracking</p>
              <p className="text-xl font-bold text-gray-900">{trackingData.user_name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {isSessionEnded ? 'Ended' : 'Started'}
              </p>
              <p className="font-medium text-gray-700">
                {formatDateTime(isSessionEnded && trackingData.safe_at ? trackingData.safe_at : trackingData.started_at)}
              </p>
            </div>
          </div>

          {/* Last Update Info */}
          {!isSessionEnded && trackingData.location_history.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-gray-600">
                  Last location: {timeAgo(trackingData.location_history[0]?.timestamp)}
                </span>
              </div>
              {lastFetched && (
                <span className="text-xs text-gray-400">
                  Updated: {lastFetched.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}

          {isSessionEnded && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-blue-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium">This person has been marked as safe</span>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="h-[500px]">
            <LiveTrackingMap
              locations={trackingData.location_history}
              userName={trackingData.user_name}
              status={trackingData.status}
              isLoading={false}
              lastUpdated={trackingData.location_history[0]?.timestamp}
            />
          </div>
        </div>

        {/* Location Stats */}
        <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-gray-600">{trackingData.location_history.length} location points recorded</span>
            </div>
            {!isSessionEnded && (
              <span className="text-gray-400 text-xs">Updates every 10 seconds</span>
            )}
          </div>
        </div>

        {/* Emergency Notice */}
        {!isSessionEnded && (
          <div className={`mt-4 rounded-xl p-4 ${
            trackingData.status === 'panic' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <svg className={`w-6 h-6 flex-shrink-0 ${
                trackingData.status === 'panic' ? 'text-yellow-600' : 'text-red-600'
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className={`font-semibold ${
                  trackingData.status === 'panic' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {trackingData.status === 'panic' ? 'Panic Alert Active' : 'Emergency Alert Active'}
                </p>
                <p className={`text-sm mt-1 ${
                  trackingData.status === 'panic' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {trackingData.status === 'panic'
                    ? 'This person pressed the panic button. They may need immediate assistance.'
                    : 'This person may be in danger. Please check on their safety if possible.'}
                </p>
                <p className={`text-sm mt-2 font-medium ${
                  trackingData.status === 'panic' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  If this is a life-threatening emergency, call 911 immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
        <p>Powered by SnapfaceID Guardian</p>
      </footer>
    </div>
  );
}
