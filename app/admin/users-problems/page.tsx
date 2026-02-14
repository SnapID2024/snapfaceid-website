'use client';

// Build timestamp: 2026-01-04T22:30:00
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';
const REFRESH_INTERVAL = 30000;

interface LogoutUser {
  id: string;
  userId: string;
  phone: string;
  nickname: string;
  subscriptionStatus: string;
  logoutAt: string;
  logoutAtUnix: number;
  reason: string;
}

interface DowngradedUser {
  id: string;
  userId: string;
  phone: string;
  nickname: string;
  previousStatus: string;
  newStatus: string;
  downgradedAt: string;
  downgradedAtUnix: number;
  reason: string;
}

interface UpgradedUser {
  id: string;
  userId: string;
  phone: string;
  nickname: string;
  previousStatus: string;
  newStatus: string;
  subscriptionSource?: string;
  isTrusted?: boolean;
  upgradedAt: string;
  upgradedAtUnix: number;
  reason: string;
}

interface PendingUpgradeUser {
  id: string;
  userId: string;
  phone: string;
  nickname: string;
  subscriptionStatus: string;
  isTrusted?: boolean;
  registeredAt: string;
  registeredAtUnix: number;
}

interface InactiveUser {
  id: string;
  userId: string;
  phone: string;
  nickname: string;
  subscriptionStatus: string;
  lastSearchAt: string | null;
  lastSearchAtUnix: number;
  daysInactive: number;
}

interface EmergencyExit {
  id: string;
  historyId: string;
  userId: string;
  userName: string;
  userNickname: string;
  userPhone: string;
  dateName: string;
  datePhone: string;
  locationType: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  startedAt: string | null;
  endedAt: string | null;
  endedAtUnix: number;
  endStatus: 'emergency' | 'safe';
  badgeType: 'emergency_exit' | 'safe_by_contact';
}

interface ProblemUsersData {
  logoutUsers: LogoutUser[];
  downgradedUsers: DowngradedUser[];
  upgradedUsers: UpgradedUser[];
  pendingUpgradeUsers: PendingUpgradeUser[];
  inactiveUsers: InactiveUser[];
  emergencyExits: EmergencyExit[];
  stats: {
    totalLogouts: number;
    totalDowngrades: number;
    totalUpgrades: number;
    totalPendingUpgrades: number;
    totalInactive: number;
    totalEmergencyExits: number;
  };
}

type TabType = 'emergency' | 'upgraded' | 'logout' | 'downgraded' | 'inactive' | 'device-reset' | 'delete-person' | 'blocked-numbers';

interface BlockedNumber {
  id: string;
  phone: string;
  blockedAt: string | null;
  reason: string;
  deletedPersonId: string;
}

interface DeletePersonPreview {
  id: string;
  phones: string[];
  selfieCount: number;
  selfieUrls: string[];
  selfieUuids: string[];
  reviewCount: number;
  isRegisteredUser?: boolean;
  userId?: string;
  userNickname?: string;
  reviewsContributed?: number;
}

export default function UsersProblemsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProblemUsersData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('emergency');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Device Reset State
  const [resetPhone, setResetPhone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetStep, setResetStep] = useState<'phone' | 'code' | 'success'>('phone');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetUsername, setResetUsername] = useState('');

  // Delete Person State
  const [deletePhone, setDeletePhone] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteStep, setDeleteStep] = useState<'search' | 'preview' | 'deleting' | 'success'>('search');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePreview, setDeletePreview] = useState<DeletePersonPreview | null>(null);
  const [deleteResults, setDeleteResults] = useState<any>(null);
  const [blockPhone, setBlockPhone] = useState(false);

  // Blocked Numbers State
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const fetchData = useCallback(async (token: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users-problems', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchData(token);

    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('adminToken');
      if (currentToken) fetchData(currentToken, false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [router, fetchData]);

  // Fetch blocked numbers when tab is activated
  useEffect(() => {
    if (activeTab === 'blocked-numbers' && blockedNumbers.length === 0 && !blockedLoading) {
      fetchBlockedNumbers();
    }
  }, [activeTab]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    if (!phone) return '—';
    // Format: +1 (XXX) XXX-XXXX or just show as-is if short
    if (phone.length >= 10) {
      const cleaned = phone.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{4})$/);
      if (match) {
        return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
      }
    }
    return phone;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '—';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Device Reset Functions
  const handleSendResetCode = async () => {
    if (!resetPhone.trim()) {
      setResetError('Please enter a phone number');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setResetLoading(true);
    setResetError(null);

    try {
      const response = await fetch('/api/admin/device-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'send-code',
          phone: resetPhone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to send code');
      }

      setResetUsername(data.username || '');
      setResetStep('code');
      setResetSuccess(`Verification code sent to ${resetPhone}`);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (!resetCode.trim() || resetCode.length !== 6) {
      setResetError('Please enter the 6-digit code');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setResetLoading(true);
    setResetError(null);

    try {
      const response = await fetch('/api/admin/device-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'verify',
          phone: resetPhone.trim(),
          code: resetCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to verify code');
      }

      setResetStep('success');
      setResetSuccess(data.message);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to verify code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetForm = () => {
    setResetPhone('');
    setResetCode('');
    setResetStep('phone');
    setResetError(null);
    setResetSuccess(null);
    setResetUsername('');
  };

  // Delete Person Functions
  const handleDeletePreview = async () => {
    if (!deletePhone.trim()) {
      setDeleteError('Please enter a phone number');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/admin/delete-person/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: deletePhone.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to find person');
      }

      if (!data.found) {
        throw new Error(data.error || 'Person not found');
      }

      setDeletePreview(data.person);
      setDeleteStep('preview');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to find person');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeletePerson = async () => {
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setDeleteLoading(true);
    setDeleteError(null);
    setDeleteStep('deleting');

    try {
      const response = await fetch('/api/admin/delete-person', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: deletePhone.trim(),
          confirm: 'DELETE',
          blockPhone: blockPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to delete person');
      }

      setDeleteResults(data.results);
      setDeleteStep('success');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete person');
      setDeleteStep('preview');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteReset = () => {
    setDeletePhone('');
    setDeleteConfirm('');
    setDeleteStep('search');
    setDeleteError(null);
    setDeletePreview(null);
    setDeleteResults(null);
    setBlockPhone(false);
  };

  // Blocked Numbers Functions
  const fetchBlockedNumbers = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setBlockedLoading(true);
    try {
      const response = await fetch('/api/admin/blocked-numbers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch blocked numbers');
      }

      const data = await response.json();
      setBlockedNumbers(data.blockedNumbers || []);
    } catch (err) {
      console.error('Error fetching blocked numbers:', err);
    } finally {
      setBlockedLoading(false);
    }
  };

  const handleUnblockNumber = async (phone: string) => {
    if (!confirm(`Unblock ${phone}? This will allow them to register again.`)) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const response = await fetch('/api/admin/blocked-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to unblock');
      }

      // Refresh list
      fetchBlockedNumbers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unblock number');
    }
  };

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="SnapFace ID" className="h-8" />
              <div className="h-5 w-px bg-gray-600" />
              <h1 className="text-lg font-bold text-white">Users & Problems</h1>
              {lastUpdated && (
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Auto-refresh 30s
              </div>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      {data && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-6 gap-3">
            {[
              { label: 'Emergency', value: data.stats.totalEmergencyExits, color: 'red' },
              { label: 'Upgrades', value: data.stats.totalUpgrades, color: 'green' },
              { label: 'Pending', value: data.stats.totalPendingUpgrades || 0, color: 'yellow' },
              { label: 'Logouts', value: data.stats.totalLogouts, color: 'blue' },
              { label: 'Downgrades', value: data.stats.totalDowngrades, color: 'orange' },
              { label: 'Inactive 7d+', value: data.stats.totalInactive, color: 'gray' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-gray-700 rounded-lg p-3 border-l-4 ${
                  stat.color === 'red' ? 'border-red-500' :
                  stat.color === 'green' ? 'border-green-500' :
                  stat.color === 'yellow' ? 'border-yellow-500' :
                  stat.color === 'blue' ? 'border-blue-500' :
                  stat.color === 'orange' ? 'border-orange-500' :
                  'border-gray-500'
                }`}
              >
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-2 py-3">
          {[
            { id: 'emergency', label: 'Emergency Exits', count: data?.stats.totalEmergencyExits },
            { id: 'upgraded', label: 'Upgrades', count: (data?.stats.totalUpgrades || 0) + (data?.stats.totalPendingUpgrades || 0) },
            { id: 'logout', label: 'Logouts', count: data?.stats.totalLogouts },
            { id: 'downgraded', label: 'Downgrades', count: data?.stats.totalDowngrades },
            { id: 'inactive', label: 'Inactive', count: data?.stats.totalInactive },
            { id: 'device-reset', label: 'Device Reset', count: undefined },
            { id: 'delete-person', label: 'Delete Person', count: undefined },
            { id: 'blocked-numbers', label: 'Blocked', count: blockedNumbers.length > 0 ? blockedNumbers.length : undefined },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all border-2 ${
                activeTab === tab.id
                  ? 'bg-[#6A1B9A] border-[#6A1B9A] text-white shadow-lg shadow-purple-900/40'
                  : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {isLoading && (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading data...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                const token = localStorage.getItem('adminToken');
                if (token) fetchData(token);
              }}
              className="mt-3 text-sm text-purple-400 hover:text-purple-300"
            >
              Try again
            </button>
          </div>
        )}

        {/* Emergency Exits Tab */}
        {!isLoading && !error && data && activeTab === 'emergency' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-32">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-40">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-36">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-40">Date Info</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider min-w-[200px]">Location</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-40">Emergency Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-32 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.emergencyExits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      No emergency exits recorded
                    </td>
                  </tr>
                ) : (
                  data.emergencyExits.map((exit) => (
                    <tr key={exit.id} className={`hover:bg-gray-700/50 ${exit.badgeType === 'emergency_exit' ? 'bg-red-900/20' : ''}`}>
                      <td className="px-4 py-3">
                        {exit.badgeType === 'emergency_exit' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-600 text-white">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            EMERGENCY
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-200 whitespace-nowrap">
                            Safe
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-white">{truncateText(exit.userNickname || exit.userName, 15)}</div>
                        {exit.userNickname && exit.userName && exit.userNickname !== exit.userName && (
                          <div className="text-xs text-gray-500">{truncateText(exit.userName, 15)}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300 font-mono">{exit.userPhone || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{truncateText(exit.dateName, 15)}</div>
                        <div className="text-xs text-gray-500 font-mono">{exit.datePhone || '—'}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="text-sm text-gray-300 break-words" title={exit.address || exit.locationType}>
                          {exit.address || exit.locationType || '—'}
                        </div>
                        {exit.address && exit.locationType && (
                          <div className="text-xs text-gray-500">{exit.locationType}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-300">{truncateText(exit.emergencyContactName, 15)}</div>
                        <div className="text-xs text-gray-500 font-mono">{exit.emergencyContactPhone || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-400">{formatDate(exit.endedAt)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Upgraded Users Tab */}
        {!isLoading && !error && data && activeTab === 'upgraded' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-48">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-44">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-36">Source</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-44">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-52 whitespace-nowrap">Eros escort model</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.upgradedUsers.length === 0 && (!data.pendingUpgradeUsers || data.pendingUpgradeUsers.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  [
                    ...data.upgradedUsers.map((u) => ({ type: 'active' as const, nickname: u.nickname, phone: u.phone, source: u.subscriptionSource || 'stripe', isTrusted: u.isTrusted || false, date: u.upgradedAt, dateUnix: u.upgradedAtUnix, id: u.id })),
                    ...(data.pendingUpgradeUsers || []).map((u) => ({ type: 'pending' as const, nickname: u.nickname, phone: u.phone, source: 'pending', isTrusted: u.isTrusted || false, date: u.registeredAt, dateUnix: u.registeredAtUnix, id: u.id })),
                  ]
                    .sort((a, b) => b.dateUnix - a.dateUnix)
                    .map((row) => (
                      <tr key={row.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-white">{row.nickname}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-300 font-mono">{row.phone}</span>
                        </td>
                        <td className="px-4 py-3">
                          {row.source === 'promo_code' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-600/30 text-purple-400 border border-purple-600/50">
                              Promo Code
                            </span>
                          ) : row.source === 'pending' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">
                              —
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600/30 text-blue-400 border border-blue-600/50">
                              Stripe
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.type === 'pending' ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-orange-600/30 text-orange-400 border border-orange-600/50">
                              Pending Upgrade
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-600/30 text-green-400 border border-green-600/50">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.isTrusted ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-pink-600/30 text-pink-400 border border-pink-600/50">
                              Verified
                            </span>
                          ) : (
                            <span className="text-sm text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-400">{formatDate(row.date)}</span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Logout Users Tab */}
        {!isLoading && !error && data && activeTab === 'logout' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-48">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-44">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-28">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-40">Reason</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.logoutUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No recent logouts recorded
                    </td>
                  </tr>
                ) : (
                  data.logoutUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-white">{user.nickname}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300 font-mono">{user.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        {user.subscriptionStatus === 'active' || user.subscriptionStatus === 'cancel_pending' ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-600/30 text-green-400">Premium</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">Free</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.reason === 'geofence_block' ? 'bg-red-600/30 text-red-400 border border-red-600/50' :
                          user.reason === 'user_initiated' ? 'bg-blue-600/30 text-blue-400' :
                          user.reason === 'user_cancelled' ? 'bg-orange-600/30 text-orange-400' :
                          user.reason.includes('subscription') ? 'bg-red-600/30 text-red-400' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {user.reason === 'geofence_block' ? 'GEO-Fence' :
                           user.reason === 'user_initiated' ? 'Manual' :
                           user.reason === 'user_cancelled' ? 'Cancelled' :
                           user.reason.includes('ended') ? 'Sub Ended' :
                           user.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-400">{formatDate(user.logoutAt)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Downgraded Users Tab */}
        {!isLoading && !error && data && activeTab === 'downgraded' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-48">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-44">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-28">From</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-28">To</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-36">Reason</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.downgradedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No subscription downgrades recorded
                    </td>
                  </tr>
                ) : (
                  data.downgradedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-white">{user.nickname}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300 font-mono">{user.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-600/30 text-green-400">
                          {user.previousStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">
                          {user.newStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.reason === 'user_cancelled' ? 'bg-orange-600/30 text-orange-400' :
                          user.reason.includes('subscription') ? 'bg-red-600/30 text-red-400' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {user.reason === 'user_cancelled' ? 'Cancelled' :
                           user.reason.includes('ended') ? 'Sub Ended' :
                           user.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-400">{formatDate(user.downgradedAt)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Inactive Users Tab */}
        {!isLoading && !error && data && activeTab === 'inactive' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-48">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-44">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-28">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-36">Last Active</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider text-right w-32">Inactive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.inactiveUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No inactive users found
                    </td>
                  </tr>
                ) : (
                  data.inactiveUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-white">{user.nickname}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300 font-mono">{user.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        {user.subscriptionStatus === 'active' || user.subscriptionStatus === 'cancel_pending' ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-600/30 text-green-400">Premium</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">Free</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-400">
                          {user.lastSearchAt ? formatDate(user.lastSearchAt) : 'Never'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          user.daysInactive > 30
                            ? 'bg-red-600/30 text-red-400'
                            : user.daysInactive > 14
                            ? 'bg-orange-600/30 text-orange-400'
                            : 'bg-yellow-600/30 text-yellow-400'
                        }`}>
                          {user.daysInactive} days
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Device Reset Tab */}
        {activeTab === 'device-reset' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Device Reset</h2>
                <p className="text-gray-400 text-sm">
                  Help users who lost their phone regain access to their account by resetting their device ID.
                </p>
              </div>

              {/* Error Message */}
              {resetError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                  {resetError}
                </div>
              )}

              {/* Success Message */}
              {resetSuccess && resetStep !== 'success' && (
                <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm">
                  {resetSuccess}
                </div>
              )}

              {/* Step 1: Enter Phone */}
              {resetStep === 'phone' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      User Phone Number
                    </label>
                    <input
                      type="text"
                      value={resetPhone}
                      onChange={(e) => setResetPhone(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter the phone number in E.164 format (with + prefix)</p>
                  </div>
                  <button
                    onClick={handleSendResetCode}
                    disabled={resetLoading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resetLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Send Verification Code
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Enter Code */}
              {resetStep === 'code' && (
                <div className="space-y-4">
                  <div className="p-3 bg-gray-700/50 rounded-lg mb-4">
                    <p className="text-sm text-gray-300">
                      Code sent to: <span className="font-mono text-white">{resetPhone}</span>
                    </p>
                    {resetUsername && (
                      <p className="text-sm text-gray-400 mt-1">
                        User: <span className="text-white">{resetUsername}</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ask the user to provide the code they received via SMS</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleResetForm}
                      className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleVerifyResetCode}
                      disabled={resetLoading || resetCode.length !== 6}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {resetLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verify & Reset
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {resetStep === 'success' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Device Reset Successful</h3>
                    <div className="p-4 bg-gray-700/50 rounded-lg text-left">
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="font-semibold text-white">User:</span> {resetUsername}
                      </p>
                      <p className="text-sm text-gray-300 mb-3">
                        <span className="font-semibold text-white">Phone:</span> {resetPhone}
                      </p>
                      <div className="p-3 bg-purple-900/30 border border-purple-700 rounded-lg">
                        <p className="text-sm text-purple-200">
                          <span className="font-semibold">Tell the user:</span> &quot;Please log in with your username and password to register your new device.&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleResetForm}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Reset Another Device
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Person Tab */}
        {activeTab === 'delete-person' && (
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Delete Person</h2>
                <p className="text-gray-400 text-sm">
                  Permanently delete a person from all systems: Luxand, Firebase Storage, and Firestore.
                </p>
              </div>

              {/* Warning Banner */}
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-red-300 font-semibold text-sm">This action is irreversible!</p>
                    <p className="text-red-400/80 text-xs mt-1">
                      All photos, reviews, and profile data will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {deleteError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                  {deleteError}
                </div>
              )}

              {/* Step 1: Search */}
              {deleteStep === 'search' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Person Phone Number
                    </label>
                    <input
                      type="text"
                      value={deletePhone}
                      onChange={(e) => setDeletePhone(e.target.value)}
                      placeholder="+1234567890"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Enter the phone number associated with the Person profile</p>
                  </div>
                  <button
                    onClick={handleDeletePreview}
                    disabled={deleteLoading}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {deleteLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Person
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Preview */}
              {deleteStep === 'preview' && deletePreview && (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-700/50 rounded-lg">
                    <h3 className="text-white font-semibold mb-3">Person Found:</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Document ID:</span>
                        <span className="text-white font-mono text-xs">{deletePreview.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Phone Numbers:</span>
                        <span className="text-white">{deletePreview.phones.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Selfies:</span>
                        <span className="text-white">{deletePreview.selfieCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reviews:</span>
                        <span className="text-white">{deletePreview.reviewCount}</span>
                      </div>
                    </div>

                    {/* Phone numbers list */}
                    {deletePreview.phones.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <p className="text-xs text-gray-400 mb-2">Associated phone numbers:</p>
                        <div className="flex flex-wrap gap-2">
                          {deletePreview.phones.map((phone, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-600 rounded text-xs text-white font-mono">
                              {phone}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Selfie thumbnails */}
                    {deletePreview.selfieUrls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <p className="text-xs text-gray-400 mb-2">Photos to be deleted:</p>
                        <div className="flex gap-2 flex-wrap">
                          {deletePreview.selfieUrls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Selfie ${idx + 1}`}
                              className="w-16 h-16 object-cover rounded-lg border-2 border-red-500"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Registered User Warning */}
                  {deletePreview.isRegisteredUser && (
                    <div className="p-4 bg-orange-900/20 border border-orange-600/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span className="text-orange-300 font-semibold text-sm">Registered User</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-orange-200">
                          <span className="text-orange-400">Nickname:</span> {deletePreview.userNickname}
                        </p>
                        <p className="text-orange-200">
                          <span className="text-orange-400">Reviews contributed:</span>{' '}
                          <span className="font-bold">{deletePreview.reviewsContributed}</span>
                          {(deletePreview.reviewsContributed ?? 0) > 0 && (
                            <span className="text-orange-400/80 ml-1">— These will be deleted from all profiles</span>
                          )}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 mt-3 pt-3 border-t border-orange-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={blockPhone}
                          onChange={(e) => setBlockPhone(e.target.checked)}
                          className="w-4 h-4 rounded border-orange-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                        />
                        <span className="text-sm text-orange-300">Block this phone from future registrations</span>
                      </label>
                    </div>
                  )}

                  {/* What will be deleted */}
                  <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                    <p className="text-red-300 font-semibold text-sm mb-2">Will be deleted:</p>
                    <ul className="text-xs text-red-400/80 space-y-1">
                      <li>• {deletePreview.selfieCount} photo(s) from Luxand facial recognition</li>
                      <li>• {deletePreview.selfieCount} image(s) from Firebase Storage</li>
                      <li>• {deletePreview.reviewCount} review(s) attached to this profile</li>
                      {deletePreview.isRegisteredUser && (deletePreview.reviewsContributed ?? 0) > 0 && (
                        <li>• {deletePreview.reviewsContributed} review(s) contributed by this user on other profiles</li>
                      )}
                      <li>• The entire Firestore document</li>
                      {blockPhone && <li>• Phone will be blocked from future registrations</li>}
                    </ul>
                  </div>

                  {/* Confirmation input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type <span className="text-red-400 font-bold">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirm}
                      onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
                      placeholder="Type DELETE"
                      className="w-full px-4 py-3 bg-gray-700 border border-red-600 rounded-lg text-white text-center font-bold tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteReset}
                      className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeletePerson}
                      disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {deleteLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Permanently
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Deleting */}
              {deleteStep === 'deleting' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white font-semibold">Deleting person...</p>
                  <p className="text-gray-400 text-sm mt-2">This may take a few seconds</p>
                </div>
              )}

              {/* Step 4: Success */}
              {deleteStep === 'success' && deleteResults && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Person Deleted Successfully</h3>
                    <div className="p-4 bg-gray-700/50 rounded-lg text-left">
                      <p className="text-sm text-gray-300 mb-2">
                        <span className="font-semibold text-white">Document ID:</span>{' '}
                        <span className="font-mono text-xs">{deleteResults.person_id}</span>
                      </p>
                      <p className="text-sm text-gray-300 mb-3">
                        <span className="font-semibold text-white">Phones:</span>{' '}
                        {deleteResults.phones?.join(', ') || 'N/A'}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Luxand deleted:</span>
                          <span className="text-green-400">{deleteResults.luxand_deleted?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Storage deleted:</span>
                          <span className="text-green-400">{deleteResults.storage_deleted?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Firestore deleted:</span>
                          <span className={deleteResults.firestore_deleted ? 'text-green-400' : 'text-red-400'}>
                            {deleteResults.firestore_deleted ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {deleteResults.reviewsDeleted > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Reviews cleaned:</span>
                            <span className="text-green-400">{deleteResults.reviewsDeleted}</span>
                          </div>
                        )}
                        {deleteResults.phoneBlocked && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Phone blocked:</span>
                            <span className="text-orange-400 font-semibold">Yes</span>
                          </div>
                        )}
                      </div>

                      {/* Errors if any */}
                      {deleteResults.luxand_errors?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-600">
                          <p className="text-xs text-orange-400 mb-1">Luxand warnings:</p>
                          <ul className="text-xs text-gray-500">
                            {deleteResults.luxand_errors.map((err: string, idx: number) => (
                              <li key={idx}>• {err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleDeleteReset}
                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Delete Another Person
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blocked Numbers Tab */}
        {activeTab === 'blocked-numbers' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            {blockedLoading ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Loading blocked numbers...</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700/50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-44">Phone</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-36">Reason</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-48">Person ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-36">Blocked At</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-32 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {blockedNumbers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        No blocked numbers found
                      </td>
                    </tr>
                  ) : (
                    blockedNumbers.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3">
                          <span className="text-sm text-white font-mono">{item.phone}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-red-600/30 text-red-400 border border-red-600/50">
                            {item.reason || 'admin_delete'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-400 font-mono">{item.deletedPersonId || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-400">{formatDate(item.blockedAt)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleUnblockNumber(item.phone)}
                            className="px-3 py-1.5 text-xs font-semibold bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600/40 transition-colors"
                          >
                            Unblock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            {!blockedLoading && blockedNumbers.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-700 flex justify-between items-center">
                <span className="text-xs text-gray-500">{blockedNumbers.length} blocked number(s)</span>
                <button
                  onClick={fetchBlockedNumbers}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Refresh
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
