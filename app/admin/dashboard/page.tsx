'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet map (client-side only)
const GuardianMap = dynamic(() => import('@/app/components/GuardianMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-xl">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#6A1B9A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-gray-500 text-sm">Loading map...</span>
      </div>
    </div>
  ),
});

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

interface Alert {
  id: string;
  userId: string;
  userName: string;
  userNickname?: string;  // Apodo como lo conoce el contacto de emergencia
  userPhone: string;
  userPhotoUrl: string;
  datePhotoUrl: string;
  dateName: string;
  datePhone: string;
  locationType?: string;  // Tipo de ubicación (Restaurant, Bar, etc.)
  dateAddress?: string;   // Dirección completa
  dateLocation: string;   // Combinado para compatibilidad
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

type FilterType = 'all' | 'active' | 'no_response' | 'emergency' | 'safe';

// Función para obtener el color y texto del estado
const getStatusDisplay = (status: Alert['status']) => {
  switch (status) {
    case 'active':
      return { color: 'bg-green-500', text: 'Active', textColor: 'text-green-700', bgLight: 'bg-green-100' };
    case 'no_response':
      return { color: 'bg-orange-500 animate-pulse', text: 'No Response', textColor: 'text-orange-700', bgLight: 'bg-orange-100' };
    case 'emergency':
      return { color: 'bg-red-600 animate-pulse', text: 'EMERGENCY', textColor: 'text-red-700', bgLight: 'bg-red-100' };
    case 'safe':
      return { color: 'bg-blue-500', text: 'Safe', textColor: 'text-blue-700', bgLight: 'bg-blue-100' };
    default:
      return { color: 'bg-gray-500', text: 'Unknown', textColor: 'text-gray-700', bgLight: 'bg-gray-100' };
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertClickTimestamp, setAlertClickTimestamp] = useState<number>(0);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [showAlertAuthoritiesModal, setShowAlertAuthoritiesModal] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);

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

        // Actualizar selectedAlert con los datos frescos del servidor
        setSelectedAlert(currentSelected => {
          if (currentSelected) {
            const updatedAlert = data.alerts.find((a: Alert) => a.id === currentSelected.id);
            return updatedAlert || null; // Si ya no existe, deseleccionar
          }
          return currentSelected;
        });
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

    // Smart polling: faster when there are alerts, slower when empty
    let intervalId: NodeJS.Timeout;

    const setupPolling = () => {
      // If there are any alerts (including safe), poll every 15 seconds
      // If no alerts, poll every 60 seconds to save resources
      const hasAlerts = alerts.length > 0;
      const pollInterval = hasAlerts ? 15000 : 60000;

      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(fetchAlerts, pollInterval);
    };

    setupPolling();

    // Re-setup polling when alerts change
    const alertsChangeHandler = () => setupPolling();

    // Only poll when tab is visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (intervalId) clearInterval(intervalId);
      } else {
        fetchAlerts(); // Fetch immediately when tab becomes visible
        setupPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router, fetchAlerts, alerts.length]);

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
        return <span className={`${baseClasses} bg-orange-100 text-orange-700 animate-pulse`}>No Response</span>;
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
    safe: alerts.filter((a) => a.status === 'safe').length,
  };

  const handleCallUser = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleSelectAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setAlertClickTimestamp(Date.now()); // Forzar re-render del mapa para centrar
    setShowEmergencyContact(false); // Close popup when selecting different alert
  };

  const handleAlertAuthorities = () => {
    if (selectedAlert) {
      setShowAlertAuthoritiesModal(true);
    }
  };

  const generateEmergencyMessage = () => {
    if (!selectedAlert) return '';
    const { userName, userPhone, dateName, datePhone, dateLocation, currentLocation, emergencyContactName, emergencyContactPhone } = selectedAlert;
    const locationUrl = currentLocation && (currentLocation.latitude !== 0 || currentLocation.longitude !== 0)
      ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
      : 'GPS not available';

    return `🚨 EMERGENCY ALERT - SnapfaceID Guardian

User in potential danger:
• Name: ${userName}
• Phone: ${userPhone}

Meeting with:
• Name: ${dateName}
• Phone: ${datePhone}
• Location: ${dateLocation}

GPS Coordinates: ${currentLocation?.latitude}, ${currentLocation?.longitude}
Map Link: ${locationUrl}

Emergency Contact:
• Name: ${emergencyContactName || 'Not provided'}
• Phone: ${emergencyContactPhone || 'Not provided'}

Time: ${new Date().toLocaleString()}

Please respond immediately.`;
  };

  const handleSendEmail = async () => {
    if (!selectedAlert) return;
    const subject = encodeURIComponent(`EMERGENCY: ${selectedAlert.userName} needs help`);
    const body = encodeURIComponent(generateEmergencyMessage());
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSendSMS = async () => {
    if (!selectedAlert) return;
    setSendingAlert(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/send-emergency-sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: selectedAlert.id,
          message: generateEmergencyMessage(),
          recipientPhone: selectedAlert.emergencyContactPhone,
        }),
      });

      if (response.ok) {
        alert('SMS sent successfully to emergency contact!');
      } else {
        const data = await response.json();
        alert(`Failed to send SMS: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending SMS:', err);
      alert('Failed to send SMS. Please try again.');
    } finally {
      setSendingAlert(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generateEmergencyMessage());
    alert('Message copied to clipboard!');
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
        // Update the alert status to "safe" (blue) - will auto-remove after 120 seconds
        setAlerts((prev) => prev.map((a) =>
          a.id === alertId ? { ...a, status: 'safe' as const } : a
        ));
        // Update selected alert if it's the one being marked safe
        if (selectedAlert?.id === alertId) {
          setSelectedAlert({ ...selectedAlert, status: 'safe' });
        }
      }
    } catch (err) {
      console.error('Error marking safe:', err);
    }
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
            {(['all', 'active', 'no_response', 'emergency', 'safe'] as FilterType[]).map((f) => {
              const displayName = f === 'all' ? 'All Alerts' :
                                  f === 'no_response' ? 'No Response' :
                                  f.charAt(0).toUpperCase() + f.slice(1);
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    filter === f ? 'bg-[#6A1B9A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {displayName}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === f ? 'bg-white/20' : 'bg-gray-200'}`}>
                    {alertCounts[f]}
                  </span>
                </button>
              );
            })}
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

            <div className="space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {!isLoading && filteredAlerts.map((alert) => {
                const statusDisplay = getStatusDisplay(alert.status);
                return (
                  <div
                    key={alert.id}
                    onClick={() => handleSelectAlert(alert)}
                    className={`rounded border cursor-pointer transition-all hover:bg-purple-50 px-2 py-1.5 ${
                      selectedAlert?.id === alert.id
                        ? 'border-[#6A1B9A] bg-purple-50 border-2'
                        : 'border-[#6A1B9A]/30 bg-white'
                    }`}
                  >
                    {/* Línea 1: UserName with DateName (Our User Date) + tiempo */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDisplay.color}`} />
                      <span className="font-semibold text-gray-900 truncate">
                        {alert.userName} <span className="font-normal text-gray-600">with</span> {alert.dateName}
                      </span>
                      <span className="text-purple-600 font-medium flex-shrink-0">(Our User Date)</span>
                      <span className="text-gray-400 ml-auto flex-shrink-0">{getTimeSince(alert.lastCheckIn)}</span>
                    </div>
                    {/* Línea 2: @ LocationType: - Address + Badge */}
                    <div className="flex items-center gap-1.5 text-xs mt-0.5 pl-3.5">
                      <span className="text-gray-500 truncate flex-1">
                        @ {alert.locationType || 'Location'}: {alert.dateAddress || alert.dateLocation}
                      </span>
                      {/* Status Badge */}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${statusDisplay.bgLight} ${statusDisplay.textColor}`}>
                        {statusDisplay.text}
                      </span>
                      {alert.currentLocation && (alert.currentLocation.latitude !== 0 || alert.currentLocation.longitude !== 0) && (
                        <svg className="h-3 w-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map & Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Interactive Map - Expanded height */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-[550px]">
                <GuardianMap
                  selectedAlert={selectedAlert}
                  allAlerts={filteredAlerts}
                  onAlertSelect={handleSelectAlert}
                  centerTrigger={alertClickTimestamp}
                />
              </div>
            </div>

            {/* Selected Alert Details - Compact Layout */}
            {selectedAlert ? (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                {/* User & Date Info - Compact horizontal layout */}
                <div className="flex flex-wrap gap-4 items-start">
                  {/* User Info - Compact (Our User) */}
                  <div className="flex items-center gap-3 flex-1 min-w-[280px] bg-purple-50 rounded-lg p-3">
                    <img src={selectedAlert.userPhotoUrl} alt={selectedAlert.userNickname || selectedAlert.userName} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#6A1B9A]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-purple-600 font-medium uppercase">Our User</p>
                      <p className="font-semibold text-gray-900 truncate">{selectedAlert.userNickname || selectedAlert.userName}</p>
                      <p className="text-xs text-gray-400">@{selectedAlert.userName}</p>
                      <p className="text-sm text-gray-500">{selectedAlert.userPhone || 'No phone'}</p>
                    </div>
                  </div>

                  {/* Date Info - Compact */}
                  <div className="flex items-center gap-3 flex-1 min-w-[280px] bg-orange-50 rounded-lg p-3">
                    <img src={selectedAlert.datePhotoUrl} alt={selectedAlert.dateName} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#FF5722]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-orange-600 font-medium uppercase">Date With</p>
                      <p className="font-semibold text-gray-900 truncate">{selectedAlert.dateName}</p>
                      <p className="text-sm text-gray-500">{selectedAlert.datePhone}</p>
                      <p className="text-xs text-gray-400 truncate">@ {selectedAlert.locationType}: {selectedAlert.dateAddress || selectedAlert.dateLocation}</p>
                    </div>
                  </div>
                </div>

                {/* Timeline - Compact horizontal */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-gray-600">Started: {formatTime(selectedAlert.activatedAt)}</span>
                    </div>
                    {selectedAlert.status === 'active' && (
                      <div className="flex items-center gap-2 bg-green-100 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-green-700 font-medium">Safe at {formatTime(selectedAlert.lastCheckIn)}</span>
                      </div>
                    )}
                    {selectedAlert.status === 'no_response' && (
                      <div className="flex items-center gap-2 bg-orange-100 px-3 py-1.5 rounded-full animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-orange-700 font-medium">Waiting since {formatTime(selectedAlert.lastCheckIn)}</span>
                      </div>
                    )}
                    {selectedAlert.status === 'emergency' && (
                      <div className="flex items-center gap-2 bg-red-100 px-3 py-1.5 rounded-full animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                        <span className="text-red-700 font-bold">EMERGENCY at {formatTime(selectedAlert.lastCheckIn)}</span>
                      </div>
                    )}
                    {selectedAlert.status === 'safe' && (
                      <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-blue-700 font-medium">Ended at {formatTime(selectedAlert.lastCheckIn)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact Info - Collapsible Section */}
                {showEmergencyContact && (
                  <div className="border-t pt-3 mt-1 mb-3">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-orange-800">Emergency Contact</h4>
                        <button
                          onClick={() => setShowEmergencyContact(false)}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-6">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Name</p>
                          <p className="font-semibold text-gray-900">
                            {selectedAlert.emergencyContactName || 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                          <p className="font-semibold text-gray-900">
                            {selectedAlert.emergencyContactPhone || 'Not provided'}
                          </p>
                        </div>
                        {selectedAlert.emergencyContactPhone && (
                          <button
                            onClick={() => handleCallUser(selectedAlert.emergencyContactPhone!)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call Emergency Contact
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t pt-3 mt-1 flex flex-wrap gap-2">
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
                    onClick={() => setShowEmergencyContact(!showEmergencyContact)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      showEmergencyContact
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {showEmergencyContact ? 'Hide' : 'Emergency Contact'}
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

      {/* Modal: Alert Authorities */}
      {showAlertAuthoritiesModal && selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-xl font-bold text-white">Alert Authorities</h2>
              </div>
              <button
                onClick={() => setShowAlertAuthoritiesModal(false)}
                className="text-white/80 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Emergency Info Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs text-purple-600 font-semibold uppercase mb-1">User in Danger</p>
                  <p className="font-bold text-gray-900">{selectedAlert.userName}</p>
                  <p className="text-sm text-gray-600">{selectedAlert.userPhone}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-xs text-orange-600 font-semibold uppercase mb-1">Meeting With</p>
                  <p className="font-bold text-gray-900">{selectedAlert.dateName}</p>
                  <p className="text-sm text-gray-600">{selectedAlert.datePhone}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Location</p>
                <p className="font-medium text-gray-900">{selectedAlert.dateLocation}</p>
                {selectedAlert.currentLocation && (selectedAlert.currentLocation.latitude !== 0 || selectedAlert.currentLocation.longitude !== 0) && (
                  <a
                    href={`https://maps.google.com/?q=${selectedAlert.currentLocation.latitude},${selectedAlert.currentLocation.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    View on Google Maps
                  </a>
                )}
              </div>

              {/* Message Preview */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Message Preview:</p>
                <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                  {generateEmergencyMessage()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t bg-gray-50 px-6 py-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSendEmail}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </button>

                <button
                  onClick={handleSendSMS}
                  disabled={sendingAlert || !selectedAlert.emergencyContactPhone}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-colors ${
                    selectedAlert.emergencyContactPhone
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {sendingAlert ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {selectedAlert.emergencyContactPhone ? 'Send SMS to Emergency Contact' : 'No Emergency Contact'}
                </button>

                <button
                  onClick={handleCopyMessage}
                  className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-3">
                Call 911 directly for immediate emergency response
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
