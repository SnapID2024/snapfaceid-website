'use client';

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
  upgradedAt: string;
  upgradedAtUnix: number;
  reason: string;
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
  inactiveUsers: InactiveUser[];
  emergencyExits: EmergencyExit[];
  stats: {
    totalLogouts: number;
    totalDowngrades: number;
    totalUpgrades: number;
    totalInactive: number;
    totalEmergencyExits: number;
  };
}

type TabType = 'emergency' | 'upgraded' | 'logout' | 'downgraded' | 'inactive';

export default function UsersProblemsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProblemUsersData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('emergency');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-900">
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
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Emergency', value: data.stats.totalEmergencyExits, color: 'red', icon: '🚨' },
              { label: 'Upgrades', value: data.stats.totalUpgrades, color: 'green', icon: '⬆️' },
              { label: 'Logouts', value: data.stats.totalLogouts, color: 'blue', icon: '🚪' },
              { label: 'Downgrades', value: data.stats.totalDowngrades, color: 'orange', icon: '⬇️' },
              { label: 'Inactive 7d+', value: data.stats.totalInactive, color: 'gray', icon: '💤' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-gray-800 rounded-lg p-3 border-l-4 ${
                  stat.color === 'red' ? 'border-red-500' :
                  stat.color === 'green' ? 'border-green-500' :
                  stat.color === 'blue' ? 'border-blue-500' :
                  stat.color === 'orange' ? 'border-orange-500' :
                  'border-gray-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
                  </div>
                  <span className="text-2xl opacity-50">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 border-b border-gray-700">
          {[
            { id: 'emergency', label: 'Emergency Exits', color: 'red', count: data?.stats.totalEmergencyExits },
            { id: 'upgraded', label: 'Upgrades', color: 'green', count: data?.stats.totalUpgrades },
            { id: 'logout', label: 'Logouts', color: 'blue', count: data?.stats.totalLogouts },
            { id: 'downgraded', label: 'Downgrades', color: 'orange', count: data?.stats.totalDowngrades },
            { id: 'inactive', label: 'Inactive', color: 'gray', count: data?.stats.totalInactive },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? `text-white border-${tab.color}-500 bg-gray-800`
                  : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                  activeTab === tab.id ? 'bg-gray-600' : 'bg-gray-700'
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
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Location</th>
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
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-200">
                            Safe by Contact
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
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-300">{truncateText(exit.address || exit.locationType, 30)}</div>
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
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-32">From</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider w-32">To</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.upgradedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                      No subscription upgrades recorded
                    </td>
                  </tr>
                ) : (
                  data.upgradedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-white">{user.nickname}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300 font-mono">{user.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">
                          {user.previousStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-600/30 text-green-400 border border-green-600/50">
                          {user.newStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-400">{formatDate(user.upgradedAt)}</span>
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
                          user.reason === 'user_initiated' ? 'bg-blue-600/30 text-blue-400' :
                          user.reason === 'user_cancelled' ? 'bg-orange-600/30 text-orange-400' :
                          user.reason.includes('subscription') ? 'bg-red-600/30 text-red-400' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {user.reason === 'user_initiated' ? 'Manual' :
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
      </div>
    </div>
  );
}
