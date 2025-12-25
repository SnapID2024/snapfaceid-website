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
  // === CAMPOS PARA DETECCIÓN DE DISPOSITIVO OFFLINE ===
  deviceOffline?: boolean;  // Si el dispositivo perdió conexión (sin heartbeat)
  offlineReason?: 'battery_dead' | 'battery_critical' | 'no_signal' | 'app_closed_or_signal_lost' | null;
  lastHeartbeat?: string;   // Última vez que el dispositivo envió heartbeat
  batteryLevel?: number;    // Nivel de batería (0-100)
  batteryState?: 'charging' | 'unplugged' | 'full' | 'unknown';  // Estado de carga
  batteryWarning?: boolean; // Si la batería está baja
  networkType?: 'wifi' | 'cellular' | 'none' | 'unknown';  // Tipo de conexión
}

interface HistoryEntry {
  id: string;
  userId: string;
  userName: string;
  userNickname: string;
  userPhone: string;
  userSelfieUrl: string;
  dateName: string;
  datePhone: string;
  datePhotoUrl: string;
  locationType: string;
  address: string;
  latitude: number;
  longitude: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  startedAt: string;
  startedAtUnix: number;
  endedAt: string;
  endedAtUnix: number;
  endStatus: 'safe' | 'emergency';
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

// Función para obtener el indicador de estado del dispositivo (batería/señal)
const getDeviceStatusDisplay = (alert: Alert) => {
  if (!alert.deviceOffline) {
    // Device online - show battery/network info if available
    if (alert.batteryWarning && alert.batteryLevel !== undefined) {
      return {
        show: true,
        icon: 'battery_low',
        text: `${alert.batteryLevel}%`,
        bgColor: 'bg-yellow-500',
        textColor: 'text-yellow-900',
        bgLight: 'bg-yellow-100',
        description: 'Low battery warning',
        animate: true,
      };
    }
    return null; // No special indicator needed
  }

  // Device is offline - show reason
  switch (alert.offlineReason) {
    case 'battery_dead':
      return {
        show: true,
        icon: 'battery_dead',
        text: 'BATTERY DEAD',
        bgColor: 'bg-red-800',
        textColor: 'text-white',
        bgLight: 'bg-red-200',
        description: 'Device battery is dead (0%)',
        animate: true,
      };
    case 'battery_critical':
      return {
        show: true,
        icon: 'battery_critical',
        text: `BATTERY ${alert.batteryLevel || '< 15'}%`,
        bgColor: 'bg-red-600',
        textColor: 'text-white',
        bgLight: 'bg-red-100',
        description: 'Device battery critically low',
        animate: true,
      };
    case 'no_signal':
      return {
        show: true,
        icon: 'no_signal',
        text: 'NO SIGNAL',
        bgColor: 'bg-gray-800',
        textColor: 'text-white',
        bgLight: 'bg-gray-200',
        description: 'Device has no network signal',
        animate: true,
      };
    case 'app_closed_or_signal_lost':
    default:
      return {
        show: true,
        icon: 'offline',
        text: 'OFFLINE',
        bgColor: 'bg-gray-700',
        textColor: 'text-white',
        bgLight: 'bg-gray-200',
        description: 'App closed or signal lost',
        animate: true,
      };
  }
};

// Componente para el icono de estado del dispositivo
const DeviceStatusIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'battery_dead':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 4h-3V2h-4v2H7c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-1 16H8V6h8v14z"/>
          <path d="M11 8h2v2h-2zM11 11h2v2h-2z" opacity="0.3"/>
          <line x1="6" y1="20" x2="18" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'battery_critical':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 4h-3V2h-4v2H7c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-1 16H8V6h8v14z"/>
          <rect x="9" y="16" width="6" height="3" fill="currentColor"/>
        </svg>
      );
    case 'battery_low':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 4h-3V2h-4v2H7c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-1 16H8V6h8v14z"/>
          <rect x="9" y="14" width="6" height="5" fill="currentColor"/>
        </svg>
      );
    case 'no_signal':
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a16 16 0 014.41-2.37M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
        </svg>
      );
    case 'offline':
    default:
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"/>
        </svg>
      );
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
  const [showHistory, setShowHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [smsRecipientPhone, setSmsRecipientPhone] = useState('');

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

  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }

    setHistoryLoading(true);
    try {
      const response = await fetch('/api/admin/guardian-history', {
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
      if (data.history) {
        setHistoryEntries(data.history);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
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

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const formatHistoryTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const handleShowHistory = () => {
    setShowHistory(true);
    fetchHistory();
  };

  const handleBackToAlerts = () => {
    setShowHistory(false);
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
    const { userName, userNickname, userPhone, dateName, datePhone, dateLocation, currentLocation, emergencyContactName, emergencyContactPhone } = selectedAlert;
    const displayName = userNickname || userName;
    const locationUrl = currentLocation && (currentLocation.latitude !== 0 || currentLocation.longitude !== 0)
      ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
      : 'GPS not available';

    return `🚨 EMERGENCY ALERT - SnapfaceID Guardian

User in potential danger:
• Name: ${displayName}
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
    if (!recipientEmail || !recipientEmail.includes('@')) {
      alert('Please enter a valid recipient email address');
      return;
    }

    setSendingEmail(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/send-emergency-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: recipientEmail,
          alertId: selectedAlert.id,
          userName: selectedAlert.userName,
          userNickname: selectedAlert.userNickname || '',
          userPhone: selectedAlert.userPhone,
          userPhotoUrl: selectedAlert.userPhotoUrl || '',
          dateName: selectedAlert.dateName,
          datePhone: selectedAlert.datePhone,
          datePhotoUrl: selectedAlert.datePhotoUrl || '',
          dateLocation: selectedAlert.dateLocation,
          locationType: selectedAlert.locationType || '',
          dateAddress: selectedAlert.dateAddress || '',
          latitude: selectedAlert.currentLocation?.latitude || 0,
          longitude: selectedAlert.currentLocation?.longitude || 0,
          emergencyContactName: selectedAlert.emergencyContactName || '',
          emergencyContactPhone: selectedAlert.emergencyContactPhone || '',
          activatedAt: selectedAlert.activatedAt,
          lastCheckIn: selectedAlert.lastCheckIn,
          status: selectedAlert.status,
        }),
      });

      if (response.ok) {
        alert(`Emergency email sent successfully to ${recipientEmail}!`);
        setRecipientEmail('');
      } else {
        const data = await response.json();
        alert(`Failed to send email: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
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

  const [sendingiMessage, setSendingiMessage] = useState(false);
  const [sendingSuspectWarning, setSendingSuspectWarning] = useState(false);
  const [suspectWarningPhone, setSuspectWarningPhone] = useState('');

  const handleSendViaiMessage = async () => {
    if (!selectedAlert) return;
    if (!smsRecipientPhone) {
      alert('Please enter a recipient phone number');
      return;
    }

    const { userName, userNickname, userPhone, userPhotoUrl, dateName, datePhone, datePhotoUrl, dateLocation, locationType, dateAddress, currentLocation, emergencyContactName, emergencyContactPhone, activatedAt, lastCheckIn, status } = selectedAlert;
    const displayName = userNickname || userName;

    const mapsLink = currentLocation && (currentLocation.latitude !== 0 || currentLocation.longitude !== 0)
      ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
      : '';

    const statusText = status === 'emergency' ? 'EMERGENCY' : status === 'no_response' ? 'NO RESPONSE' : status.toUpperCase();

    // Plantilla profesional para iMessage
    const message = `━━━━━━━━━━━━━━━━━━━━
🚨 ALERTA DE EMERGENCIA
━━━━━━━━━━━━━━━━━━━━
Estado: ${statusText}

👤 USUARIO EN PELIGRO
${displayName}
Tel: ${userPhone}

👥 EN CITA CON
${dateName}
Tel: ${datePhone}

📍 UBICACIÓN
${locationType || 'Lugar'}: ${dateAddress || dateLocation}
${mapsLink ? `Maps: ${mapsLink}` : ''}

⏰ Último check-in: ${new Date(lastCheckIn).toLocaleTimeString()}

📞 Contacto de Emergencia
${emergencyContactName || 'N/A'}: ${emergencyContactPhone || 'N/A'}
━━━━━━━━━━━━━━━━━━━━
SnapfaceID Guardian`;

    // Limpiar el número de teléfono (solo dígitos y +)
    const cleanPhone = smsRecipientPhone.replace(/[^\d+]/g, '');

    setSendingiMessage(true);

    try {
      // Intentar enviar via servidor local (genera imagen con todo integrado)
      const response = await fetch('http://localhost:3847/send-imessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          userPhotoUrl: userPhotoUrl || '',
          datePhotoUrl: datePhotoUrl || '',
          messageData: {
            status: statusText,
            userName: displayName,
            userPhone: userPhone,
            dateName: dateName,
            datePhone: datePhone,
            locationType: locationType || 'Location',
            address: dateAddress || dateLocation,
            dateLocation: dateLocation,
            mapsLink: mapsLink,
            lastCheckIn: new Date(lastCheckIn).toLocaleTimeString(),
            emergencyContactName: emergencyContactName || 'N/A',
            emergencyContactPhone: emergencyContactPhone || 'N/A',
          },
        }),
      });

      if (response.ok) {
        alert('iMessage enviado exitosamente con fotos!');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Error del servidor');
      }
    } catch (error) {
      console.log('Servidor local no disponible, usando sms: URL scheme');
      // Fallback: abrir app de Mensajes via sms: URL scheme (sin fotos)
      const fullMessage = message + `\n\n📷 Photos:\n${userPhotoUrl || 'N/A'}\n${datePhotoUrl || 'N/A'}`;
      const smsUrl = `sms:${cleanPhone}&body=${encodeURIComponent(fullMessage)}`;
      window.open(smsUrl, '_self');
    } finally {
      setSendingiMessage(false);
    }
  };

  const handleSendSuspectWarning = async () => {
    if (!selectedAlert) return;

    // Usar el teléfono ingresado manualmente
    if (!suspectWarningPhone) {
      alert('Please enter a phone number for the warning');
      return;
    }

    const { userName, userNickname, userPhone, userPhotoUrl, dateName, datePhone: dPhone, datePhotoUrl, dateLocation, locationType, dateAddress, currentLocation, emergencyContactName, emergencyContactPhone, lastCheckIn, status } = selectedAlert;
    const displayName = userNickname || userName;

    const mapsLink = currentLocation && (currentLocation.latitude !== 0 || currentLocation.longitude !== 0)
      ? `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`
      : '';

    const statusText = status === 'emergency' ? 'EMERGENCY' : status === 'no_response' ? 'NO RESPONSE' : status.toUpperCase();

    // Limpiar el número de teléfono ingresado
    const cleanPhone = suspectWarningPhone.replace(/[^\d+]/g, '');

    setSendingSuspectWarning(true);

    try {
      const response = await fetch('http://localhost:3847/send-imessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          template: 'suspect',  // Usar plantilla de sospechoso
          userPhotoUrl: userPhotoUrl || '',
          datePhotoUrl: datePhotoUrl || '',
          messageData: {
            status: statusText,
            userName: displayName,
            userPhone: userPhone,
            dateName: dateName,
            datePhone: dPhone,
            locationType: locationType || 'Location',
            address: dateAddress || dateLocation,
            dateLocation: dateLocation,
            mapsLink: mapsLink,
            lastCheckIn: new Date(lastCheckIn).toLocaleTimeString(),
            emergencyContactName: emergencyContactName || 'N/A',
            emergencyContactPhone: emergencyContactPhone || 'N/A',
          },
        }),
      });

      if (response.ok) {
        alert(`Warning sent successfully to ${suspectWarningPhone}!`);
        setSuspectWarningPhone('');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Server error');
      }
    } catch (error) {
      console.error('Error sending suspect warning:', error);
      alert('Failed to send warning. Make sure the local server is running.');
    } finally {
      setSendingSuspectWarning(false);
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
                  onClick={() => { setFilter(f); setShowHistory(false); }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                    filter === f && !showHistory ? 'bg-[#6A1B9A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {displayName}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === f && !showHistory ? 'bg-white/20' : 'bg-gray-200'}`}>
                    {alertCounts[f]}
                  </span>
                </button>
              );
            })}
            {/* Separator */}
            <div className="w-px h-8 bg-gray-300 mx-2" />
            {/* History Tab */}
            <button
              onClick={handleShowHistory}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                showHistory ? 'bg-[#6A1B9A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
              <span className={`px-2 py-0.5 rounded-full text-xs ${showHistory ? 'bg-white/20' : 'bg-gray-200'}`}>
                90d
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showHistory ? (
          /* History View */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBackToAlerts}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h2 className="font-semibold text-gray-900 text-lg">Guardian History (Last 90 Days)</h2>
              </div>
              <span className="text-sm text-gray-500">
                {historyEntries.length} entries
              </span>
            </div>

            {/* History Loading State */}
            {historyLoading && (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                <div className="w-8 h-8 border-4 border-[#6A1B9A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading history...</p>
              </div>
            )}

            {/* History Empty State */}
            {!historyLoading && historyEntries.length === 0 && (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center">
                <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-gray-900 mb-1">No History Available</h3>
                <p className="text-gray-500 text-sm">
                  Guardian session history will appear here after sessions are completed.
                </p>
              </div>
            )}

            {/* History List */}
            {!historyLoading && historyEntries.length > 0 && (
              <div className="space-y-3">
                {historyEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${
                      entry.endStatus === 'emergency' ? 'border-red-500' : 'border-blue-500'
                    }`}
                  >
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">Day: {formatDate(entry.endedAt)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          entry.endStatus === 'emergency'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {entry.endStatus === 'emergency' ? 'EMERGENCY' : 'Safe'}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Location:</span> {entry.locationType}{entry.address ? `: ${entry.address}` : ''}
                    </div>

                    {/* User and Date Info with Photos */}
                    <div className="flex items-center gap-4 mb-3">
                      {/* User */}
                      <div className="flex items-center gap-2">
                        <img
                          src={entry.userSelfieUrl || '/placeholder-user.png'}
                          alt={entry.userNickname}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.png'; }}
                        />
                        <span className="font-medium text-gray-900">{entry.userNickname || entry.userName}</span>
                      </div>

                      <span className="text-gray-400">was on a date with</span>

                      {/* Date Person */}
                      <div className="flex items-center gap-2">
                        <img
                          src={entry.datePhotoUrl || '/placeholder-user.png'}
                          alt={entry.dateName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.png'; }}
                        />
                        <span className="font-medium text-gray-900">{entry.dateName}</span>
                      </div>
                    </div>

                    {/* Time Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Started:</span> {formatHistoryTime(entry.startedAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Ended:</span> {formatHistoryTime(entry.endedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
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
                      {/* Device Status Badge (Battery/Signal) */}
                      {(() => {
                        const deviceStatus = getDeviceStatusDisplay(alert);
                        if (deviceStatus) {
                          return (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${deviceStatus.bgColor} ${deviceStatus.textColor} ${deviceStatus.animate ? 'animate-pulse' : ''} flex items-center gap-1`}
                              title={deviceStatus.description}
                            >
                              <DeviceStatusIcon type={deviceStatus.icon} />
                              {deviceStatus.text}
                            </span>
                          );
                        }
                        return null;
                      })()}
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

                {/* Device Status Warning Banner */}
                {(() => {
                  const deviceStatus = getDeviceStatusDisplay(selectedAlert);
                  if (!deviceStatus) return null;

                  // Define banner styles based on offline reason
                  const getBannerStyles = () => {
                    switch (selectedAlert.offlineReason) {
                      case 'battery_dead':
                        return {
                          bg: 'bg-red-900',
                          iconBg: 'bg-red-600',
                          title: 'BATTERY DEAD',
                          description: 'User device battery is completely drained.',
                          icon: (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17 4h-3V2h-4v2H7c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-1 16H8V6h8v14z"/>
                              <line x1="6" y1="20" x2="18" y2="6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                          ),
                        };
                      case 'battery_critical':
                        return {
                          bg: 'bg-red-800',
                          iconBg: 'bg-red-500',
                          title: 'BATTERY CRITICAL',
                          description: `User device battery critically low (${selectedAlert.batteryLevel || '< 15'}%).`,
                          icon: (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17 4h-3V2h-4v2H7c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-1 16H8V6h8v14z"/>
                              <rect x="9" y="16" width="6" height="3" fill="currentColor"/>
                            </svg>
                          ),
                        };
                      case 'no_signal':
                        return {
                          bg: 'bg-gray-800',
                          iconBg: 'bg-gray-600',
                          title: 'NO SIGNAL',
                          description: 'User device has lost network signal (WiFi and cellular unavailable).',
                          icon: (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a16 16 0 014.41-2.37M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
                            </svg>
                          ),
                        };
                      case 'app_closed_or_signal_lost':
                      default:
                        return {
                          bg: 'bg-gray-900',
                          iconBg: 'bg-gray-600',
                          title: 'DEVICE OFFLINE',
                          description: 'User device lost connection (app may be closed or signal lost).',
                          icon: (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                            </svg>
                          ),
                        };
                    }
                  };

                  const bannerStyles = getBannerStyles();

                  return (
                    <div className="border-t pt-3 mt-3">
                      <div className={`${bannerStyles.bg} text-white rounded-lg p-4 flex items-center gap-4 animate-pulse`}>
                        <div className={`${bannerStyles.iconBg} rounded-full p-2`}>
                          {bannerStyles.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{bannerStyles.title}</h4>
                          <p className="text-gray-300 text-sm">
                            {bannerStyles.description}
                            {selectedAlert.lastHeartbeat && (
                              <span className="ml-2">Last heartbeat: {getTimeSince(selectedAlert.lastHeartbeat)}</span>
                            )}
                          </p>
                          <p className="text-yellow-400 text-xs mt-1 font-medium">
                            Guardian backend continues monitoring. Emergency alerts will still be triggered.
                          </p>
                        </div>
                        {/* Battery Level Display */}
                        {selectedAlert.batteryLevel !== undefined && (
                          <div className="text-center">
                            <div className={`text-2xl font-bold ${selectedAlert.batteryLevel <= 15 ? 'text-red-400' : selectedAlert.batteryLevel <= 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {selectedAlert.batteryLevel}%
                            </div>
                            <div className="text-xs text-gray-400">Last Battery</div>
                          </div>
                        )}
                        {/* Network Type Display */}
                        {selectedAlert.networkType && (
                          <div className="text-center">
                            <div className={`text-sm font-bold ${selectedAlert.networkType === 'none' ? 'text-red-400' : 'text-gray-400'}`}>
                              {selectedAlert.networkType === 'wifi' ? '📶 WiFi' :
                               selectedAlert.networkType === 'cellular' ? '📱 Cellular' :
                               selectedAlert.networkType === 'none' ? '❌ None' : '? Unknown'}
                            </div>
                            <div className="text-xs text-gray-400">Network</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

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
        )}
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
              {/* Emergency Info Summary with Photos */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-xs text-purple-600 font-semibold uppercase mb-2">User in Danger</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedAlert.userPhotoUrl || '/placeholder-user.png'}
                      alt={selectedAlert.userNickname || selectedAlert.userName}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.png'; }}
                    />
                    <div>
                      <p className="font-bold text-gray-900">{selectedAlert.userNickname || selectedAlert.userName}</p>
                      <p className="text-sm text-gray-600">{selectedAlert.userPhone}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-xs text-orange-600 font-semibold uppercase mb-2">Meeting With</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedAlert.datePhotoUrl || '/placeholder-user.png'}
                      alt={selectedAlert.dateName}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-orange-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-user.png'; }}
                    />
                    <div>
                      <p className="font-bold text-gray-900">{selectedAlert.dateName}</p>
                      <p className="text-sm text-gray-600">{selectedAlert.datePhone}</p>
                    </div>
                  </div>
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
              {/* Two columns: Email and iMessage/SMS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Email Section */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <label className="block text-sm font-semibold text-blue-700 mb-2">
                    Send via Email (with photos)
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@email.com"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !recipientEmail}
                    className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                      sendingEmail || !recipientEmail
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white text-sm`}
                  >
                    {sendingEmail ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>

                {/* iMessage/SMS Section */}
                <div className="bg-green-50 rounded-lg p-3">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Send via iMessage/SMS (Mac)
                  </label>
                  <input
                    type="tel"
                    value={smsRecipientPhone}
                    onChange={(e) => setSmsRecipientPhone(e.target.value)}
                    placeholder="+1 (786) 555-1234"
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleSendViaiMessage}
                    disabled={!smsRecipientPhone || sendingiMessage}
                    className={`w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                      !smsRecipientPhone || sendingiMessage
                        ? 'bg-green-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white text-sm`}
                  >
                    {sendingiMessage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    )}
                    {sendingiMessage ? 'Sending...' : 'Send iMessage + Photos'}
                  </button>
                </div>
              </div>

              {/* Send Warning to Suspect/Date Section */}
              <div className="bg-orange-100 rounded-lg p-3 mb-4 border-2 border-orange-400">
                <label className="block text-sm font-bold text-orange-800 mb-2">
                  Send Warning to Suspect/Date
                </label>
                <p className="text-xs text-orange-700 mb-2">
                  Send a warning message informing that police are on their way. Date phone: {selectedAlert.datePhone || 'N/A'}
                </p>
                <input
                  type="tel"
                  value={suspectWarningPhone}
                  onChange={(e) => setSuspectWarningPhone(e.target.value)}
                  placeholder={selectedAlert.datePhone || "+1 (786) 555-1234"}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm mb-2"
                />
                <button
                  onClick={handleSendSuspectWarning}
                  disabled={!suspectWarningPhone || sendingSuspectWarning}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                    !suspectWarningPhone || sendingSuspectWarning
                      ? 'bg-orange-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700'
                  } text-white text-sm`}
                >
                  {sendingSuspectWarning ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {sendingSuspectWarning ? 'Sending...' : 'Send Warning'}
                </button>
              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSendSMS}
                  disabled={sendingAlert || !selectedAlert.emergencyContactPhone}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    selectedAlert.emergencyContactPhone
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {sendingAlert ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  Twilio SMS
                </button>

                <button
                  onClick={handleCopyMessage}
                  className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Text
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
