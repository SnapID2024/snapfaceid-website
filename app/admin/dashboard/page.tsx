'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

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
  currentLocation: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

type FilterType = 'all' | 'active' | 'no_response' | 'emergency';

export default function AdminDashboard() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAlerts = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }

    try {
      const response = await fetch('/api/admin/guardian-alerts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin');
        return;
      }

      const data = await response.json();

      if (data.alerts) {
        setAlerts(data.alerts);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Unable to fetch alerts. Backend may be offline.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }

    // Fetch alerts immediately
    fetchAlerts();

    // Set up polling every 30 seconds for real-time updates
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, [router, fetchAlerts]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin');
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'active':
        return <span className={`${baseClasses} bg-green-100 text-green-700`}>Active</span>;
      case 'no_response':
        return <span className={`${baseClasses} bg-red-100 text-red-700 animate-pulse`}>No Response</span>;
      case 'emergency':
        return <span className={`${baseClasses} bg-red-600 text-white animate-pulse`}>EMERGENCY</span>;
      case 'safe':
        return <span className={`${baseClasses} bg-blue-100 text-blue-700`}>Safe</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-700`}>{status}</span>;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSince = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ago`;
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  const alertCounts = {
    all: alerts.length,
    active: alerts.filter((a) => a.status === 'active').length,
    no_response: alerts.filter((a) => a.status === 'no_response').length,
    emergency: alerts.filter((a) => a.status === 'emergency').length,
  };

  const handleCallUser = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleAlertAuthorities = () => {
    if (selectedAlert) {
      const { dateLocation, userPhone, datePhone, userName } = selectedAlert;
      const message = `Emergency Alert for ${userName}:\nLocation: ${dateLocation}\nUser Phone: ${userPhone}\nDate Phone: ${datePhone}`;
      alert(`Preparing to alert authorities...\n\n${message}\n\nIn production, this would connect to 911 dispatch.`);
    }
  };

  const handleMarkSafe = async (alertId: string) => {
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`/api/admin/guardian-alerts/${alertId}/mark-safe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'safe' as const } : a)));
        if (selectedAlert?.id === alertId) {
          setSelectedAlert((prev) => (prev ? { ...prev, status: 'safe' } : null));
        }
      }
    } catch (err) {
      console.error('Error marking safe:', err);
      // Still update UI optimistically
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'safe' as const } : a)));
      if (selectedAlert?.id === alertId) {
        setSelectedAlert((prev) => (prev ? { ...prev, status: 'safe' } : null));
      }
    }
  };

  const renderStaticMap = () => {
    if (!selectedAlert) return null;
    const { latitude, longitude } = selectedAlert.currentLocation;
    return (
      <div className="w-full h-[300px] bg-gradient-to-br from-[#3D1A54] to-[#6A1B9A] flex flex-col items-center justify-center text-white">
        <svg className="h-16 w-16 mb-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-lg font-semibold">{selectedAlert.dateLocation}</p>
        <p className="text-sm opacity-70 mt-2">
          Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
        </p>
        <a
          href={`https://www.google.com/maps?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Open in Google Maps
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-[#3D1A54] text-white shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src={LOGO_URL} alt="SnapfaceID" className="h-10 w-10 rounded-lg" />
              <div>
                <span className="font-bold text-lg">Guardian Monitor</span>
                <span className="hidden sm:inline text-white/70 ml-2">Admin Dashboard</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="font-semibold">{alertCounts.active + alertCounts.no_response + alertCounts.emergency}</span>
                <span className="text-white/70 text-sm hidden sm:inline">Active Alerts</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-3 overflow-x-auto">
            <svg className="h-5 w-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {(['all', 'active', 'no_response', 'emergency'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                  filter === f ? 'bg-[#6A1B9A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All Alerts' : f === 'no_response' ? 'No Response' : f.charAt(0).toUpperCase() + f.slice(1)}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === f ? 'bg-white/20' : 'bg-gray-200'}`}>
                  {alertCounts[f]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alert List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Guardian Alerts ({filteredAlerts.length})</h2>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                <div className="w-8 h-8 border-4 border-[#6A1B9A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading alerts...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <svg className="h-8 w-8 text-red-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={fetchAlerts}
                  className="mt-3 text-sm text-[#6A1B9A] hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredAlerts.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="font-semibold text-gray-900 mb-1">No Active Alerts</h3>
                <p className="text-gray-500 text-sm">
                  {filter === 'all'
                    ? 'All users are safe. No Guardian alerts in the last 24 hours.'
                    : `No alerts with "${filter}" status.`}
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
              {!isLoading && filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
                    selectedAlert?.id === alert.id ? 'ring-2 ring-[#6A1B9A]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img src={alert.userPhotoUrl || '/placeholder-user.png'} alt={alert.userName} className="w-12 h-12 rounded-full object-cover bg-gray-200" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{alert.userName}</h3>
                        {getStatusBadge(alert.status)}
                      </div>
                      <p className="text-sm text-gray-500">{alert.userPhone}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate">Date: {alert.dateName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span className="truncate">{alert.dateLocation}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Last check-in: {getTimeSince(alert.lastCheckIn)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map & Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {selectedAlert ? (
                renderStaticMap()
              ) : (
                <div className="w-full h-[300px] bg-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="h-12 w-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p>Select an alert to view location</p>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Alert Details */}
            {selectedAlert ? (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* User Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      User Information
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={selectedAlert.userPhotoUrl} alt={selectedAlert.userName} className="w-16 h-16 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-gray-900">{selectedAlert.userName}</p>
                        <p className="text-gray-500">{selectedAlert.userPhone}</p>
                        {getStatusBadge(selectedAlert.status)}
                      </div>
                    </div>
                  </div>

                  {/* Date Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-[#FF5722]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Date Information
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <img src={selectedAlert.datePhotoUrl} alt={selectedAlert.dateName} className="w-16 h-16 rounded-full object-cover" />
                      <div>
                        <p className="font-semibold text-gray-900">{selectedAlert.dateName}</p>
                        <p className="text-gray-500">{selectedAlert.datePhone}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {selectedAlert.dateLocation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-600">Guardian activated at {formatTime(selectedAlert.activatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600">Last check-in at {formatTime(selectedAlert.lastCheckIn)}</span>
                    </div>
                    {selectedAlert.status === 'no_response' && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-red-600 font-medium">No response to check-in request</span>
                      </div>
                    )}
                    {selectedAlert.status === 'emergency' && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-red-700 font-bold">EMERGENCY ALERT TRIGGERED</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t pt-4 mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleCallUser(selectedAlert.userPhone)}
                    className="flex items-center gap-2 bg-[#6A1B9A] hover:bg-[#8B4DAE] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call User
                  </button>
                  <button
                    onClick={handleAlertAuthorities}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Alert Authorities
                  </button>
                  <button
                    onClick={() => handleMarkSafe(selectedAlert.id)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark Safe
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <svg className="h-16 w-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Alert</h3>
                <p className="text-gray-500">Click on an alert from the list to view details and take action</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
