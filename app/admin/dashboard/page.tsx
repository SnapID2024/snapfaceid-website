'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  status: 'active' | 'no_response' | 'safe' | 'emergency' | 'panic';
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
  deviceSleeping?: boolean; // Si el dispositivo está probablemente bloqueado (no es emergencia)
  offlineReason?: 'battery_dead' | 'battery_critical' | 'no_signal' | 'device_sleeping' | 'app_closed_or_signal_lost' | null;
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

// Tipos para Advertiser (mensajes tipo ticker)
type AdvertiserAudience = 'all' | 'premium' | 'free' | 'specific';

interface AdvertiserMessage {
  id: string;
  message: string;
  audience: AdvertiserAudience;
  specificPhone?: string;
  expiresAt: string;
  createdAt: string;
  active: boolean;
}

type FilterType = 'all' | 'active' | 'no_response' | 'emergency' | 'panic' | 'safe';

// Función para obtener el color y texto del estado
const getStatusDisplay = (status: Alert['status']) => {
  switch (status) {
    case 'active':
      return { color: 'bg-green-500', text: 'Active', textColor: 'text-green-700', bgLight: 'bg-green-100' };
    case 'no_response':
      return { color: 'bg-orange-500 animate-pulse', text: 'No Response', textColor: 'text-orange-700', bgLight: 'bg-orange-100' };
    case 'emergency':
      return { color: 'bg-red-600 animate-pulse', text: 'EMERGENCY', textColor: 'text-red-700', bgLight: 'bg-red-100' };
    case 'panic':
      return { color: 'bg-yellow-400 animate-pulse', text: '🆘 PANIC', textColor: 'text-yellow-800', bgLight: 'bg-yellow-100' };
    case 'safe':
      return { color: 'bg-blue-500', text: 'Safe', textColor: 'text-blue-700', bgLight: 'bg-blue-100' };
    default:
      return { color: 'bg-gray-500', text: 'Unknown', textColor: 'text-gray-700', bgLight: 'bg-gray-100' };
  }
};

// Función para obtener el indicador de estado del dispositivo (batería/señal)
// NOTA: Solo Emergency debe ser rojo - estados de dispositivo son grises/azules
const getDeviceStatusDisplay = (alert: Alert) => {
  if (!alert.deviceOffline) {
    // Device online - show battery/network info if available
    if (alert.batteryWarning && alert.batteryLevel !== undefined) {
      return {
        show: true,
        icon: 'battery_low',
        text: `${alert.batteryLevel}%`,
        bgColor: 'bg-gray-600',  // Gris medio para advertencia de batería
        textColor: 'text-white',
        bgLight: 'bg-gray-200',
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
        bgColor: 'bg-gray-900',  // Gris más oscuro - situación más crítica
        textColor: 'text-white',
        bgLight: 'bg-gray-300',
        description: 'Device battery is dead (0%)',
        animate: true,
      };
    case 'battery_critical':
      return {
        show: true,
        icon: 'battery_critical',
        text: `BATTERY ${alert.batteryLevel || '< 15'}%`,
        bgColor: 'bg-gray-800',  // Gris oscuro
        textColor: 'text-white',
        bgLight: 'bg-gray-200',
        description: 'Device battery critically low',
        animate: true,
      };
    case 'no_signal':
      return {
        show: true,
        icon: 'no_signal',
        text: 'NO SIGNAL',
        bgColor: 'bg-gray-700',  // Gris medio-oscuro
        textColor: 'text-white',
        bgLight: 'bg-gray-200',
        description: 'Device has no network signal',
        animate: true,
      };
    case 'device_sleeping':
    case 'app_closed_or_signal_lost':
    default:
      // Dispositivo no responde - pero NO es emergencia
      // iOS suspende la app cuando la pantalla se bloquea, esto es comportamiento normal
      return {
        show: true,
        icon: 'sleeping',
        text: 'STANDBY',
        bgColor: 'bg-slate-500',  // Gris azulado - estado normal
        textColor: 'text-white',
        bgLight: 'bg-slate-100',
        description: 'Screen locked or app in background (normal)',
        animate: false,  // Sin animación - no es urgente
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
    case 'sleeping':
    case 'offline':
    default:
      // Icono de luna para indicar standby/pantalla bloqueada
      return (
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
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

  // Estados para Advertiser
  const [showAdvertiser, setShowAdvertiser] = useState(false);
  const [advertiserMessages, setAdvertiserMessages] = useState<AdvertiserMessage[]>([]);
  const [advertiserLoading, setAdvertiserLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newMessageAudience, setNewMessageAudience] = useState<AdvertiserAudience>('all');
  const [newMessagePhone, setNewMessagePhone] = useState('');
  const [newMessageExpiry, setNewMessageExpiry] = useState('');
  const [savingMessage, setSavingMessage] = useState(false);

  // Estados para Push Notifications
  const [showPushNotifications, setShowPushNotifications] = useState(false);
  const [pushCountryCode, setPushCountryCode] = useState('+1');
  const [pushPhone, setPushPhone] = useState('');
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushUserInfo, setPushUserInfo] = useState<{
    found: boolean;
    userName?: string;
    userEmail?: string;
    subscriptionStatus?: string;
    hasPushToken?: boolean;
    canSendPush?: boolean;
    message?: string;
  } | null>(null);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);

  // Estados para Bulk Push Notifications
  const [pushMode, setPushMode] = useState<'individual' | 'bulk'>('individual');
  const [bulkTitle, setBulkTitle] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkTarget, setBulkTarget] = useState<'all' | 'premium' | 'free'>('all');
  const [sendingBulkPush, setSendingBulkPush] = useState(false);
  const [bulkPushResult, setBulkPushResult] = useState<{
    sent: number;
    failed: number;
    skippedNoToken: number;
    total: number;
  } | null>(null);

  // Estado para contador de complaints pendientes
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);

  // === PANIC ALERT SOUND ===
  // Refs para detectar nuevas alertas de pánico y reproducir sonido
  const previousPanicAlertIdsRef = useRef<Set<string>>(new Set());
  const panicAudioRef = useRef<HTMLAudioElement | null>(null);
  const panicSoundTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPanicSoundPlaying, setIsPanicSoundPlaying] = useState(false);

  // Lista de países con banderas y códigos
  const countryCodes = [
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+1', flag: '🇨🇦', name: 'Canada' },
    { code: '+52', flag: '🇲🇽', name: 'Mexico' },
    { code: '+34', flag: '🇪🇸', name: 'Spain' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+39', flag: '🇮🇹', name: 'Italy' },
    { code: '+55', flag: '🇧🇷', name: 'Brazil' },
    { code: '+54', flag: '🇦🇷', name: 'Argentina' },
    { code: '+57', flag: '🇨🇴', name: 'Colombia' },
    { code: '+56', flag: '🇨🇱', name: 'Chile' },
    { code: '+51', flag: '🇵🇪', name: 'Peru' },
    { code: '+58', flag: '🇻🇪', name: 'Venezuela' },
    { code: '+53', flag: '🇨🇺', name: 'Cuba' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+82', flag: '🇰🇷', name: 'South Korea' },
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+7', flag: '🇷🇺', name: 'Russia' },
  ];

  // Derived state: check if any device is offline (for faster polling)
  const hasOfflineDevices = alerts.some(a => a.deviceOffline);

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

    // Smart polling with offline device detection
    let intervalId: NodeJS.Timeout;

    const setupPolling = () => {
      // Polling intervals:
      // - 10 seconds: when there are offline devices (to detect reconnection quickly)
      // - 15 seconds: when there are active alerts but no offline devices
      // - 60 seconds: when no alerts (save resources)
      let pollInterval: number;
      if (hasOfflineDevices) {
        pollInterval = 10000; // 10 seconds for offline device recovery detection
        console.log('🔄 Polling every 10s - Offline device detected');
      } else if (alerts.length > 0) {
        pollInterval = 15000; // 15 seconds for active alerts
      } else {
        pollInterval = 60000; // 60 seconds when idle
      }

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
  }, [router, fetchAlerts, alerts.length, hasOfflineDevices]);

  // === PANIC ALERT SOUND EFFECT ===
  // Detectar nuevas alertas de pánico y reproducir sonido agudo por 30 segundos
  useEffect(() => {
    // Obtener todas las alertas de pánico actuales
    const currentPanicAlerts = alerts.filter(a => a.status === 'panic');
    const currentPanicIds = new Set(currentPanicAlerts.map(a => a.id));

    // Buscar alertas de pánico NUEVAS (no vistas antes)
    const newPanicAlerts = currentPanicAlerts.filter(
      a => !previousPanicAlertIdsRef.current.has(a.id)
    );

    // Si hay nuevas alertas de pánico, reproducir sonido
    if (newPanicAlerts.length > 0 && !isPanicSoundPlaying) {
      console.log('🆘 NUEVA ALERTA DE PÁNICO DETECTADA:', newPanicAlerts.map(a => a.userName));

      // Crear y reproducir audio
      if (!panicAudioRef.current) {
        // Usar Web Audio API para generar un tono agudo de alarma
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Tono agudo alternante (tipo sirena)
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5

        // Modular la frecuencia para efecto de sirena
        const modulateFrequency = () => {
          if (!isPanicSoundPlaying) return;
          oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
          oscillator.frequency.linearRampToValueAtTime(1320, audioContext.currentTime + 0.5);
          oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 1);
        };

        // Volumen
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

        oscillator.start();
        setIsPanicSoundPlaying(true);

        // Modular frecuencia cada segundo
        const modulationInterval = setInterval(modulateFrequency, 1000);

        // Detener después de 30 segundos
        panicSoundTimeoutRef.current = setTimeout(() => {
          oscillator.stop();
          audioContext.close();
          clearInterval(modulationInterval);
          setIsPanicSoundPlaying(false);
          console.log('🔇 Sonido de pánico detenido después de 30 segundos');
        }, 30000);

        // Guardar referencia para limpieza
        (panicAudioRef.current as any) = { oscillator, audioContext, modulationInterval };
      }
    }

    // Actualizar los IDs de pánico conocidos
    previousPanicAlertIdsRef.current = currentPanicIds;

    // Cleanup cuando el componente se desmonte
    return () => {
      if (panicSoundTimeoutRef.current) {
        clearTimeout(panicSoundTimeoutRef.current);
      }
      if (panicAudioRef.current) {
        try {
          const audioState = panicAudioRef.current as any;
          if (audioState.oscillator) audioState.oscillator.stop();
          if (audioState.audioContext) audioState.audioContext.close();
          if (audioState.modulationInterval) clearInterval(audioState.modulationInterval);
        } catch (e) {
          // Ignorar errores de limpieza
        }
      }
    };
  }, [alerts, isPanicSoundPlaying]);

  // Fetch pending complaints count
  useEffect(() => {
    const fetchComplaintsCount = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      try {
        const response = await fetch('/api/admin/complaints?status=pending_action&count_only=true', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPendingComplaintsCount(data.count || 0);
        }
      } catch (err) {
        console.error('Error fetching complaints count:', err);
      }
    };

    fetchComplaintsCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchComplaintsCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
      case 'panic':
        return <span className={`${baseClasses} bg-yellow-400 text-yellow-900 animate-pulse font-bold`}>🆘 PANIC</span>;
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
    setShowAdvertiser(false);
    setShowPushNotifications(false);
  };

  // ─────────── Funciones de Advertiser ───────────
  const fetchAdvertiserMessages = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setAdvertiserLoading(true);
    try {
      const response = await fetch('/api/admin/advertiser-messages', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.messages) {
        setAdvertiserMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching advertiser messages:', err);
    } finally {
      setAdvertiserLoading(false);
    }
  };

  const handleShowAdvertiser = () => {
    setShowAdvertiser(true);
    setShowHistory(false);
    fetchAdvertiserMessages();
  };

  const handleSaveMessage = async () => {
    if (!newMessage.trim() || !newMessageExpiry) {
      alert('Please fill in the message and expiration date');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Not authenticated');
      return;
    }

    setSavingMessage(true);
    try {
      const response = await fetch('/api/admin/advertiser-messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
          audience: newMessageAudience,
          specificPhone: newMessageAudience === 'specific' ? newMessagePhone : undefined,
          expiresAt: newMessageExpiry,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reset form
        setNewMessage('');
        setNewMessageAudience('all');
        setNewMessagePhone('');
        setNewMessageExpiry('');
        // Refresh messages
        fetchAdvertiserMessages();
        alert('Message created successfully!');
      } else {
        console.error('Error response:', data);
        alert(`Error: ${data.error || 'Failed to create message'}`);
      }
    } catch (err) {
      console.error('Error saving message:', err);
      alert(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSavingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      await fetch(`/api/admin/advertiser-messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchAdvertiserMessages();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // ─────────── Funciones de Push Notifications ───────────
  const handleShowPushNotifications = () => {
    setShowPushNotifications(true);
    setShowHistory(false);
    setShowAdvertiser(false);
    // Reset form
    setPushCountryCode('+1');
    setPushPhone('');
    setPushTitle('');
    setPushMessage('');
    setPushUserInfo(null);
  };

  const getFullPhoneNumber = () => {
    // Combinar código de país con número de teléfono
    const cleanPhone = pushPhone.replace(/[\s\-\(\)]/g, '');
    return `${pushCountryCode}${cleanPhone}`;
  };

  const handleVerifyPhone = async () => {
    if (!pushPhone.trim()) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setVerifyingPhone(true);
    setPushUserInfo(null);

    const fullPhone = getFullPhoneNumber();

    try {
      const response = await fetch('/api/admin/push/verify-phone', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        setPushUserInfo(data);
      } else {
        setPushUserInfo({ found: false, message: data.error || 'Failed to verify phone' });
      }
    } catch (err) {
      console.error('Error verifying phone:', err);
      setPushUserInfo({ found: false, message: 'Network error' });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleSendPush = async () => {
    if (!pushPhone || !pushTitle || !pushMessage || !pushUserInfo?.canSendPush) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setSendingPush(true);
    const fullPhone = getFullPhoneNumber();

    try {
      const response = await fetch('/api/admin/push/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhone,
          title: pushTitle,
          message: pushMessage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Push notification sent to ${data.userName}!`);
        // Reset form
        setPushTitle('');
        setPushMessage('');
      } else {
        alert(`Error: ${data.error || 'Failed to send push notification'}`);
      }
    } catch (err) {
      console.error('Error sending push:', err);
      alert('Network error sending push notification');
    } finally {
      setSendingPush(false);
    }
  };

  const handleSendBulkPush = async () => {
    if (!bulkTitle || !bulkMessage) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    // Confirmar antes de enviar
    const targetText = bulkTarget === 'all' ? 'ALL users' : bulkTarget === 'premium' ? 'Premium users only' : 'Free users only';
    const confirmed = window.confirm(`Are you sure you want to send this notification to ${targetText}?\n\nTitle: ${bulkTitle}\nMessage: ${bulkMessage}`);
    if (!confirmed) return;

    setSendingBulkPush(true);
    setBulkPushResult(null);

    try {
      const response = await fetch('/api/admin/push/send-bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: bulkTitle,
          message: bulkMessage,
          target: bulkTarget,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBulkPushResult(data.stats);
        // Reset form
        setBulkTitle('');
        setBulkMessage('');
      } else {
        alert(`Error: ${data.error || 'Failed to send bulk push notification'}`);
      }
    } catch (err) {
      console.error('Error sending bulk push:', err);
      alert('Network error sending bulk push notification');
    } finally {
      setSendingBulkPush(false);
    }
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
    panic: alerts.filter((a) => a.status === 'panic').length,
    safe: alerts.filter((a) => a.status === 'safe').length,
  };

  // Función para abrir modal de llamada con Twilio Voice
  const openCallModal = (targetType: 'user' | 'date' | 'emergency_contact', phone: string, name: string) => {
    setCallTargetType(targetType);
    setCallTargetPhone(phone);
    setCallTargetName(name);
    setShowCallModal(true);
  };

  // Función legacy para llamar directamente desde el dispositivo
  const handleCallUser = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  // Función para iniciar llamada con Twilio Voice
  const handleTwilioCall = async () => {
    if (!selectedAlert || !callTargetPhone) return;

    setCallingInProgress(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.snapfaceid.com'}/admin/call/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert_id: selectedAlert.id,
          target_type: callTargetType,
          target_phone: callTargetPhone,
          target_name: callTargetName,
          operator_phone: operatorPhone || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Call initiated successfully!\n\nTarget Call SID: ${result.target_call_sid}\n${result.operator_call_sid ? `Operator Call SID: ${result.operator_call_sid}` : ''}\nConference: ${result.conference_name}`);
        setShowCallModal(false);
        setOperatorPhone('');
      } else {
        const error = await response.json();
        alert(`❌ Failed to initiate call: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Call error:', error);
      alert(`❌ Error initiating call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCallingInProgress(false);
    }
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
  const [callingInProgress, setCallingInProgress] = useState(false);
  const [operatorPhone, setOperatorPhone] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [callTargetType, setCallTargetType] = useState<'user' | 'date' | 'emergency_contact'>('user');
  const [callTargetPhone, setCallTargetPhone] = useState('');
  const [callTargetName, setCallTargetName] = useState('');

  const handleSendViaiMessage = async () => {
    if (!selectedAlert) return;
    if (!smsRecipientPhone) {
      alert('Please enter a recipient phone number');
      return;
    }

    const { userName, userNickname, userPhone, userPhotoUrl, dateName, datePhone, datePhotoUrl, dateLocation, locationType, dateAddress, currentLocation, emergencyContactName, emergencyContactPhone, lastCheckIn } = selectedAlert;
    const displayName = userNickname || userName;

    // Limpiar el número de teléfono (solo dígitos y +)
    const cleanPhone = smsRecipientPhone.replace(/[^\d+]/g, '');

    // Formatear ubicación
    const location = `${locationType || 'Location'}: ${dateAddress || dateLocation || 'N/A'}`;

    setSendingiMessage(true);

    try {
      // Enviar MMS via Twilio con flyer generado
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.snapfaceid.com'}/admin/send-emergency-mms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: selectedAlert.id,
          recipient_phone: cleanPhone,
          date_photo_url: datePhotoUrl || '',
          user_photo_url: userPhotoUrl || '',
          date_phone: datePhone || '',
          date_name: dateName || '',
          user_name: displayName || '',
          contact_name: emergencyContactName || '',
          location: location,
          last_check_time: lastCheckIn ? new Date(lastCheckIn).toLocaleTimeString() : 'N/A',
          language: 'en',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Emergency MMS sent successfully via Twilio!');
      } else {
        throw new Error(data.detail || data.message || 'Server error');
      }
    } catch (error) {
      console.error('Error sending emergency MMS:', error);
      alert(`Failed to send MMS: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    const { userName, userNickname, userPhotoUrl, dateName, datePhone, datePhotoUrl, dateLocation, locationType, dateAddress, currentLocation, emergencyContactName, lastCheckIn } = selectedAlert;
    const displayName = userNickname || userName;

    // Limpiar el número de teléfono ingresado
    const cleanPhone = suspectWarningPhone.replace(/[^\d+]/g, '');

    // Formatear ubicación de la cita
    const meetingLocation = dateAddress || dateLocation || 'N/A';

    setSendingSuspectWarning(true);

    try {
      // Enviar advertencia MMS via Twilio con flyer
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.snapfaceid.com'}/admin/send-suspect-warning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_id: selectedAlert.id,
          recipient_phone: cleanPhone,
          // For flyer generation
          date_photo_url: datePhotoUrl || '',
          user_photo_url: userPhotoUrl || '',
          date_phone: datePhone || '',
          date_name: dateName || '',
          user_name: displayName || '',
          contact_name: emergencyContactName || '',
          // Location info
          meeting_location: meetingLocation,
          current_location_lat: currentLocation?.latitude || null,
          current_location_lng: currentLocation?.longitude || null,
          last_check_time: lastCheckIn ? new Date(lastCheckIn).toLocaleTimeString() : 'N/A',
          language: 'en',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Warning MMS sent successfully to ${suspectWarningPhone} via Twilio!`);
        setSuspectWarningPhone('');
      } else {
        throw new Error(data.detail || data.message || 'Server error');
      }
    } catch (error) {
      console.error('Error sending suspect warning:', error);
      alert(`Failed to send warning: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                <span className="font-semibold">{alertCounts.active + alertCounts.no_response + alertCounts.emergency + alertCounts.panic}</span>
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
          <div className="flex items-center gap-1 py-2 flex-wrap">
            <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {(['all', 'active', 'no_response', 'emergency', 'panic', 'safe'] as FilterType[]).map((f) => {
              const displayName = f === 'all' ? 'All' :
                                  f === 'no_response' ? 'No Resp' :
                                  f === 'panic' ? '🆘' :
                                  f.charAt(0).toUpperCase() + f.slice(1);
              return (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setShowHistory(false); setShowAdvertiser(false); setShowPushNotifications(false); }}
                  className={`px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all ${
                    filter === f && !showHistory && !showAdvertiser && !showPushNotifications ? 'bg-[#6A1B9A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {displayName}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${filter === f && !showHistory && !showAdvertiser && !showPushNotifications ? 'bg-white/20' : 'bg-gray-200'}`}>
                    {alertCounts[f]}
                  </span>
                </button>
              );
            })}
            {/* Separator */}
            <div className="w-px h-6 bg-gray-300 mx-1" />
            {/* History Tab */}
            <button
              onClick={handleShowHistory}
              className={`px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                showHistory && !showAdvertiser && !showPushNotifications ? 'bg-[#6A1B9A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              History
              <span className={`px-1 py-0.5 rounded-full text-xs ${showHistory && !showAdvertiser && !showPushNotifications ? 'bg-white/20' : 'bg-gray-200'}`}>
                90d
              </span>
            </button>
            {/* Advertiser Tab */}
            <button
              onClick={handleShowAdvertiser}
              className={`px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all ${
                showAdvertiser ? 'bg-[#6A1B9A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ads
            </button>
            {/* Push Notifications Tab */}
            <button
              onClick={handleShowPushNotifications}
              className={`px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all ${
                showPushNotifications ? 'bg-[#6A1B9A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Push
            </button>
            {/* Problemas/Users Tab - Link to separate page */}
            <a
              href="/admin/users-problems"
              className="px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Users
            </a>
            {/* Verification Tab - Link to verification logs */}
            <a
              href="/admin/verification"
              className="px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Verify
            </a>
            {/* Trusted Validation Tab - Link to trusted validation logs */}
            <a
              href="/admin/trusted-validation"
              className="px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Trusted
            </a>
            {/* Geofence Tab - Link to geofence management */}
            <a
              href="/admin/geofence"
              className="px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all bg-purple-100 text-purple-700 hover:bg-purple-200"
            >
              Geofence
            </a>
            {/* Complaints Tab - Link to complaints management */}
            <a
              href="/admin/complaints"
              className="relative px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              Complaints
              {pendingComplaintsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-sm">
                  {pendingComplaintsCount > 99 ? '99+' : pendingComplaintsCount}
                </span>
              )}
            </a>
            {/* Frontend Logs Tab - Debug logs from mobile app */}
            <a
              href="/admin/frontend-logs"
              className="px-2 py-1 rounded-md font-medium text-xs whitespace-nowrap transition-all bg-orange-100 text-orange-700 hover:bg-orange-200"
            >
              App Logs
            </a>
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
        ) : showAdvertiser ? (
          /* Advertiser View */
          <div className="space-y-6">
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
                <h2 className="font-semibold text-gray-900 text-lg">📢 Advertiser - Broadcast Messages</h2>
              </div>
              <span className="text-sm text-gray-500">
                {advertiserMessages.filter(m => m.active).length} active messages
              </span>
            </div>

            {/* Form para crear nuevo mensaje */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Create New Message</h3>

              <div className="space-y-4">
                {/* Mensaje */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Text
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Enter your broadcast message..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent resize-none"
                  />
                </div>

                {/* Audiencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { value: 'all', label: '👥 All Users', desc: 'Premium & Free' },
                      { value: 'premium', label: '⭐ Premium', desc: 'Premium only' },
                      { value: 'free', label: '🆓 Free', desc: 'Free users only' },
                      { value: 'specific', label: '📱 Specific', desc: 'By phone number' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setNewMessageAudience(opt.value as AdvertiserAudience)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          newMessageAudience === opt.value
                            ? 'border-[#6A1B9A] bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campo de teléfono (solo si audience es 'specific') */}
                {newMessageAudience === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (with country code)
                    </label>
                    <input
                      type="tel"
                      value={newMessagePhone}
                      onChange={(e) => setNewMessagePhone(e.target.value)}
                      placeholder="+1 555 123 4567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent"
                    />
                  </div>
                )}

                {/* Fecha de expiración */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={newMessageExpiry}
                    onChange={(e) => setNewMessageExpiry(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent"
                  />
                </div>

                {/* Botón guardar */}
                <button
                  onClick={handleSaveMessage}
                  disabled={!newMessage.trim() || !newMessageExpiry || savingMessage || (newMessageAudience === 'specific' && !newMessagePhone)}
                  className="w-full bg-[#6A1B9A] hover:bg-[#8B4DAE] text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {savingMessage ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Message
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Lista de mensajes existentes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Active Messages</h3>

              {advertiserLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-[#6A1B9A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading messages...</p>
                </div>
              ) : advertiserMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <p>No messages yet</p>
                  <p className="text-sm">Create your first broadcast message above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {advertiserMessages.map((msg) => {
                    const isExpired = new Date(msg.expiresAt) < new Date();
                    const audienceLabel = msg.audience === 'all' ? '👥 All' :
                                         msg.audience === 'premium' ? '⭐ Premium' :
                                         msg.audience === 'free' ? '🆓 Free' :
                                         `📱 ${msg.specificPhone}`;
                    return (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-lg border ${isExpired ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-green-50 border-green-200'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{msg.message}</p>
                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                              <span className="bg-gray-100 px-2 py-0.5 rounded">{audienceLabel}</span>
                              <span>
                                {isExpired ? '❌ Expired' : '✅ Active'} • Expires: {msg.expiresAt}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete message"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info sobre rotación */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-blue-900">How it works</p>
                  <p className="text-sm text-blue-700">Messages will appear as a rotating ticker on user profiles, cycling every 15 seconds. Only active (non-expired) messages matching the user&apos;s subscription type will be shown.</p>
                </div>
              </div>
            </div>
          </div>
        ) : showPushNotifications ? (
          /* Push Notifications View */
          <div className="space-y-6">
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
                <h2 className="font-semibold text-gray-900 text-lg">Push Notifications</h2>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => { setPushMode('individual'); setBulkPushResult(null); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pushMode === 'individual'
                    ? 'bg-[#6A1B9A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Individual User
              </button>
              <button
                onClick={() => { setPushMode('bulk'); setPushUserInfo(null); }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  pushMode === 'bulk'
                    ? 'bg-[#6A1B9A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All Users (Bulk)
              </button>
            </div>

            {/* Form para enviar push notification */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {pushMode === 'individual' ? 'Send to Individual User' : 'Send to All Users'}
              </h3>

              {pushMode === 'individual' ? (
                <div className="space-y-5">
                  {/* Selector de País y Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Country & Phone Number
                    </label>
                    <div className="flex gap-2">
                      {/* Selector de país con bandera */}
                      <select
                        value={pushCountryCode}
                        onChange={(e) => {
                          setPushCountryCode(e.target.value);
                          setPushUserInfo(null);
                        }}
                        className="px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent bg-white text-lg"
                      >
                        {countryCodes.map((country, idx) => (
                          <option key={`${country.code}-${idx}`} value={country.code}>
                            {country.flag} {country.code} {country.name}
                          </option>
                        ))}
                      </select>
                      {/* Input de teléfono */}
                      <input
                        type="tel"
                        value={pushPhone}
                        onChange={(e) => {
                          setPushPhone(e.target.value);
                          setPushUserInfo(null);
                        }}
                        placeholder="786 449 0937"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent"
                      />
                      {/* Botón Verify */}
                      <button
                        onClick={handleVerifyPhone}
                        disabled={!pushPhone.trim() || verifyingPhone}
                        className="px-6 py-3 bg-[#6A1B9A] hover:bg-[#8B4DAE] text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {verifyingPhone ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        )}
                        Verify
                      </button>
                    </div>
                  </div>

                  {/* Resultado de verificación */}
                  {pushUserInfo && (
                    <div className={`p-4 rounded-lg border ${
                      pushUserInfo.found && pushUserInfo.canSendPush
                        ? 'bg-green-50 border-green-200'
                        : pushUserInfo.found
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-red-50 border-red-200'
                    }`}>
                      {pushUserInfo.found ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <svg className={`h-5 w-5 ${pushUserInfo.canSendPush ? 'text-green-500' : 'text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pushUserInfo.canSendPush ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"} />
                            </svg>
                            <span className="font-semibold text-gray-900">{pushUserInfo.userName}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              pushUserInfo.subscriptionStatus === 'active' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {pushUserInfo.subscriptionStatus === 'active' ? 'Premium' : 'Free'}
                            </span>
                          </div>
                          {pushUserInfo.userEmail && (
                            <p className="text-sm text-gray-600">{pushUserInfo.userEmail}</p>
                          )}
                          <p className={`text-sm ${pushUserInfo.canSendPush ? 'text-green-700' : 'text-yellow-700'}`}>
                            {pushUserInfo.canSendPush
                              ? '✅ User can receive push notifications'
                              : '⚠️ ' + (pushUserInfo.message || 'User cannot receive push notifications')}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-red-700">{pushUserInfo.message || 'User not found with this phone number'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Separador */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Notification Content</h4>
                  </div>

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                      placeholder="Enter notification title..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent"
                    />
                  </div>

                  {/* Mensaje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Message
                    </label>
                    <textarea
                      value={pushMessage}
                      onChange={(e) => setPushMessage(e.target.value)}
                      placeholder="Write your push notification message here..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{pushMessage.length} characters</p>
                  </div>

                  {/* Botón enviar */}
                  <button
                    onClick={handleSendPush}
                    disabled={!pushUserInfo?.canSendPush || !pushTitle.trim() || !pushMessage.trim() || sendingPush}
                    className="w-full bg-[#6A1B9A] hover:bg-[#8B4DAE] text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {sendingPush ? (
                      <>
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Push Notification
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Target Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Send To
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setBulkTarget('all')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                          bulkTarget === 'all'
                            ? 'bg-[#6A1B9A] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All Users
                      </button>
                      <button
                        onClick={() => setBulkTarget('premium')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                          bulkTarget === 'premium'
                            ? 'bg-[#6A1B9A] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Premium Only
                      </button>
                      <button
                        onClick={() => setBulkTarget('free')}
                        className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                          bulkTarget === 'free'
                            ? 'bg-[#6A1B9A] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Free Only
                      </button>
                    </div>
                  </div>

                  {/* Separador */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Notification Content</h4>
                  </div>

                  {/* Título */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Title
                    </label>
                    <input
                      type="text"
                      value={bulkTitle}
                      onChange={(e) => setBulkTitle(e.target.value)}
                      placeholder="Enter notification title..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent"
                    />
                  </div>

                  {/* Mensaje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Message
                    </label>
                    <textarea
                      value={bulkMessage}
                      onChange={(e) => setBulkMessage(e.target.value)}
                      placeholder="Write your push notification message here..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">{bulkMessage.length} characters</p>
                  </div>

                  {/* Resultado del envío masivo */}
                  {bulkPushResult && (
                    <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold text-green-900">Bulk Push Sent Successfully!</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-green-700">✅ Sent: {bulkPushResult.sent}</div>
                        <div className="text-red-600">❌ Failed: {bulkPushResult.failed}</div>
                        <div className="text-gray-600">⏭️ No token: {bulkPushResult.skippedNoToken}</div>
                        <div className="text-gray-600">📊 Total: {bulkPushResult.total}</div>
                      </div>
                    </div>
                  )}

                  {/* Botón enviar */}
                  <button
                    onClick={handleSendBulkPush}
                    disabled={!bulkTitle.trim() || !bulkMessage.trim() || sendingBulkPush}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    {sendingBulkPush ? (
                      <>
                        <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending to all users...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Send to {bulkTarget === 'all' ? 'All Users' : bulkTarget === 'premium' ? 'Premium Users' : 'Free Users'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-blue-900">How it works</p>
                  <p className="text-sm text-blue-700">
                    {pushMode === 'individual'
                      ? 'Enter a phone number with country code (e.g., +1 for USA). The system will verify if this number belongs to a registered user. Push notifications can only be sent to users who have the app installed and notifications enabled.'
                      : 'Send a push notification to all registered users at once. Only users with the app installed and notifications enabled will receive it. Use this feature responsibly.'}
                  </p>
                </div>
              </div>
            </div>
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

            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {!isLoading && filteredAlerts.map((alert) => {
                const statusDisplay = getStatusDisplay(alert.status);
                const deviceStatus = getDeviceStatusDisplay(alert);

                // Colores de banner según estado de sesión
                const getSessionBannerStyle = () => {
                  switch (alert.status) {
                    case 'emergency':
                      return {
                        bg: 'bg-red-600',
                        text: 'EMERGENCY',
                        icon: (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ),
                      };
                    case 'safe':
                      return {
                        bg: 'bg-blue-500',
                        text: 'SAFE',
                        icon: (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ),
                      };
                    case 'no_response':
                      return {
                        bg: 'bg-orange-500',
                        text: 'NO RESPONSE',
                        icon: (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ),
                      };
                    case 'panic':
                      return {
                        bg: 'bg-yellow-400',
                        text: '🆘 PANIC - USER CALLING 911',
                        icon: (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        ),
                      };
                    case 'active':
                    default:
                      return {
                        bg: 'bg-green-500',
                        text: 'ACTIVE',
                        icon: (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ),
                      };
                  }
                };

                const sessionBanner = getSessionBannerStyle();

                return (
                  <div
                    key={alert.id}
                    onClick={() => handleSelectAlert(alert)}
                    className={`rounded-lg overflow-hidden border cursor-pointer transition-all hover:shadow-md ${
                      selectedAlert?.id === alert.id
                        ? 'border-[#6A1B9A] ring-2 ring-[#6A1B9A]/30'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {/* Banner de Estado de Sesión con efecto latido */}
                    <div className={`${sessionBanner.bg} text-white px-3 py-1.5 flex items-center gap-2 animate-pulse`}>
                      {sessionBanner.icon}
                      <span className="font-bold text-sm">{sessionBanner.text}</span>
                      <span className="ml-auto text-xs opacity-90">{getTimeSince(alert.lastCheckIn)}</span>
                    </div>

                    {/* Contenido de la alerta */}
                    <div className="px-3 py-2 bg-white">
                      {/* Línea 1: UserName with DateName */}
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-gray-900 truncate">
                          {alert.userName} <span className="font-normal text-gray-600">with</span> {alert.dateName}
                        </span>
                        <span className="text-purple-600 font-medium flex-shrink-0">(Our User's Date)</span>
                      </div>

                      {/* Línea 2: Location */}
                      <div className="flex items-center gap-1.5 text-xs mt-1 text-gray-500">
                        <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">
                          {alert.locationType || 'Location'}: {alert.dateAddress || alert.dateLocation}
                        </span>
                        {alert.currentLocation && (alert.currentLocation.latitude !== 0 || alert.currentLocation.longitude !== 0) && (
                          <span title="GPS Available">
                            <svg className="h-3 w-3 text-green-500 flex-shrink-0 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            </svg>
                          </span>
                        )}
                      </div>

                      {/* Línea 3: Device Status Badge (si aplica) */}
                      {deviceStatus && (
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold ${deviceStatus.bgColor} ${deviceStatus.textColor} animate-pulse`}
                            title={deviceStatus.description}
                          >
                            <DeviceStatusIcon type={deviceStatus.icon} />
                            {deviceStatus.text}
                          </span>
                        </div>
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
                  // NOTA: Todos los banners de estado de dispositivo son GRISES
                  // Solo Emergency debe ser rojo para evitar confusión visual
                  const getBannerStyles = () => {
                    switch (selectedAlert.offlineReason) {
                      case 'battery_dead':
                        return {
                          bg: 'bg-gray-900',  // Gris más oscuro - situación más crítica
                          iconBg: 'bg-gray-700',
                          title: 'BATTERY DEAD',
                          description: 'User device battery is completely drained.',
                          animate: true,
                          icon: (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17 4h-3V2h-4v2H7c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-1 16H8V6h8v14z"/>
                              <line x1="6" y1="20" x2="18" y2="6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                            </svg>
                          ),
                        };
                      case 'battery_critical':
                        return {
                          bg: 'bg-gray-800',  // Gris oscuro
                          iconBg: 'bg-gray-600',
                          title: 'BATTERY CRITICAL',
                          description: `User device battery critically low (${selectedAlert.batteryLevel || '< 15'}%).`,
                          animate: true,
                          icon: (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17 4h-3V2h-4v2H7c-.55 0-1 .45-1 1v16c0 .55.45 1 1 1h10c.55 0 1-.45 1-1V5c0-.55-.45-1-1-1zm-1 16H8V6h8v14z"/>
                              <rect x="9" y="16" width="6" height="3" fill="currentColor"/>
                            </svg>
                          ),
                        };
                      case 'no_signal':
                        return {
                          bg: 'bg-gray-700',  // Gris medio-oscuro
                          iconBg: 'bg-gray-500',
                          title: 'NO SIGNAL',
                          description: 'User device has lost network signal (WiFi and cellular unavailable).',
                          animate: true,
                          icon: (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a16 16 0 014.41-2.37M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
                            </svg>
                          ),
                        };
                      case 'device_sleeping':
                      case 'app_closed_or_signal_lost':
                      default:
                        // Dispositivo en standby - NO es emergencia
                        // iOS suspende apps cuando la pantalla se bloquea
                        return {
                          bg: 'bg-slate-500',  // Gris azulado - estado normal
                          iconBg: 'bg-slate-400',
                          title: 'STANDBY',
                          description: 'Screen locked or app in background. iOS suspends apps when phone is locked - this is normal.',
                          animate: false,  // Sin animación - no es urgente
                          isNormal: true,  // Flag para mensaje diferente
                          icon: (
                            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
                            </svg>
                          ),
                        };
                    }
                  };

                  const bannerStyles = getBannerStyles();

                  return (
                    <div className="border-t pt-3 mt-3">
                      <div className={`${bannerStyles.bg} text-white rounded-lg p-4 flex items-center gap-4 ${bannerStyles.animate !== false ? 'animate-pulse' : ''}`}>
                        <div className={`${bannerStyles.iconBg} rounded-full p-2`}>
                          {bannerStyles.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{bannerStyles.title}</h4>
                          <p className={`${bannerStyles.isNormal ? 'text-blue-100' : 'text-gray-300'} text-sm`}>
                            {bannerStyles.description}
                            {selectedAlert.lastHeartbeat && (
                              <span className="ml-2">Last heartbeat: {getTimeSince(selectedAlert.lastHeartbeat)}</span>
                            )}
                          </p>
                          {bannerStyles.isNormal ? (
                            <p className="text-blue-200 text-xs mt-1 font-medium">
                              ✓ No action needed. When user unlocks phone, app will resume automatically.
                            </p>
                          ) : (
                            <p className="text-yellow-400 text-xs mt-1 font-medium">
                              Guardian backend continues monitoring. Emergency alerts will still be triggered.
                            </p>
                          )}
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
                            onClick={() => openCallModal('emergency_contact', selectedAlert.emergencyContactPhone!, selectedAlert.emergencyContactName || 'Emergency Contact')}
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
                    onClick={() => openCallModal('user', selectedAlert.userPhone, selectedAlert.userNickname || selectedAlert.userName)}
                    className="flex items-center gap-2 bg-[#6A1B9A] hover:bg-[#8B4DAE] text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call User
                  </button>

                  {selectedAlert.datePhone && (
                    <button
                      onClick={() => openCallModal('date', selectedAlert.datePhone!, selectedAlert.dateName || 'Date')}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Date
                    </button>
                  )}

                  {selectedAlert.emergencyContactPhone && (
                    <button
                      onClick={() => openCallModal('emergency_contact', selectedAlert.emergencyContactPhone!, selectedAlert.emergencyContactName || 'Emergency Contact')}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call Emergency Contact
                    </button>
                  )}

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
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col">
            {/* Header - Fixed */}
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
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

            {/* Content - Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
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

              {/* Actions */}
              <div className="border-t bg-gray-50 -mx-6 px-6 py-4 mt-4">
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

                {/* SMS/MMS Section via Twilio */}
                <div className="bg-green-50 rounded-lg p-3">
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Send Emergency MMS via Twilio
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
                    {sendingiMessage ? 'Sending...' : 'Send SMS + Photo (Twilio)'}
                  </button>
                </div>
              </div>

              {/* Send Warning to Suspect/Date Section via Twilio MMS */}
              <div className="bg-orange-100 rounded-lg p-3 mb-4 border-2 border-orange-400">
                <label className="block text-sm font-bold text-orange-800 mb-2">
                  Send Warning to Suspect/Date (Twilio MMS)
                </label>
                <p className="text-xs text-orange-700 mb-2">
                  Send warning MMS with flyer + 911 notification message. Date phone: {selectedAlert.datePhone || 'N/A'}
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
                  {sendingSuspectWarning ? 'Sending...' : 'Send Warning MMS + Flyer (Twilio)'}
                </button>
              </div>

              {/* Quick Actions Row */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCopyMessage}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Emergency Text
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-3">
                Call 911 directly for immediate emergency response
              </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Twilio Voice Call */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-[#6A1B9A] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <h2 className="text-xl font-bold text-white">Initiate Call</h2>
              </div>
              <button
                onClick={() => { setShowCallModal(false); setOperatorPhone(''); }}
                className="text-white/80 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Calling</p>
                <p className="font-bold text-gray-900 text-lg">{callTargetName}</p>
                <p className="text-gray-600">{callTargetPhone}</p>
                <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                  callTargetType === 'user' ? 'bg-purple-100 text-purple-700' :
                  callTargetType === 'date' ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {callTargetType === 'user' ? 'User' : callTargetType === 'date' ? 'Date' : 'Emergency Contact'}
                </span>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operator Phone (optional)
                </label>
                <input
                  type="tel"
                  value={operatorPhone}
                  onChange={(e) => setOperatorPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter your phone number to join the call and speak with the target
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>How it works:</strong> Twilio will call the target. If you provide your phone number,
                  you will also receive a call and be connected to the same conference.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowCallModal(false); setOperatorPhone(''); }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTwilioCall}
                  disabled={callingInProgress}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#6A1B9A] hover:bg-[#8B4DAE] text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {callingInProgress ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Calling...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Start Call
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
