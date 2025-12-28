'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';
const REFRESH_INTERVAL = 30000; // 30 segundos

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
  inactiveUsers: InactiveUser[];
  emergencyExits: EmergencyExit[];
  stats: {
    totalLogouts: number;
    totalDowngrades: number;
    totalInactive: number;
    totalEmergencyExits: number;
  };
}

type TabType = 'emergency' | 'logout' | 'downgraded' | 'inactive';

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
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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

    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('adminToken');
      if (currentToken) {
        fetchData(currentToken, false); // No mostrar loading en refresh
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [router, fetchData]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSubscriptionBadge = (status: string) => {
    const isActive = status === 'active' || status === 'cancel_pending';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
      }`}>
        {isActive ? 'Premium' : 'Free'}
      </span>
    );
  };

  const getReasonBadge = (reason: string) => {
    const reasonMap: Record<string, { label: string; color: string }> = {
      'user_initiated': { label: 'User Initiated', color: 'bg-blue-100 text-blue-700' },
      'user_cancelled': { label: 'User Cancelled', color: 'bg-orange-100 text-orange-700' },
      'subscription_ended': { label: 'Subscription Ended', color: 'bg-red-100 text-red-700' },
      'subscription_ended_webhook': { label: 'Auto-Cancelled', color: 'bg-red-100 text-red-700' },
    };
    const config = reasonMap[reason] || { label: reason, color: 'bg-gray-100 text-gray-700' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getEmergencyBadge = (badgeType: 'emergency_exit' | 'safe_by_contact') => {
    if (badgeType === 'emergency_exit') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white animate-pulse">
          Emergency Exit
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-400 text-white">
        Safe by Emergency Contact
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="SnapFace ID" className="h-10" />
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Problemas/Users</h1>
              {lastUpdated && (
                <span className="text-xs text-gray-500 ml-2">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Auto-refresh: 30s
              </div>
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalEmergencyExits}</p>
                  <p className="text-sm text-gray-500">Emergency Exits</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalLogouts}</p>
                  <p className="text-sm text-gray-500">Recent Logouts</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalDowngrades}</p>
                  <p className="text-sm text-gray-500">Downgrades</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{data.stats.totalInactive}</p>
                  <p className="text-sm text-gray-500">Inactive (7+ days)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'emergency'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Emergency Exits
            </span>
          </button>
          <button
            onClick={() => setActiveTab('logout')}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'logout'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logouts
            </span>
          </button>
          <button
            onClick={() => setActiveTab('downgraded')}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'downgraded'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
              Downgrades
            </span>
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'inactive'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Inactive 7+ Days
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading */}
        {isLoading && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="w-8 h-8 border-4 border-[#6A1B9A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => {
                const token = localStorage.getItem('adminToken');
                if (token) fetchData(token);
              }}
              className="mt-3 text-sm text-[#6A1B9A] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Emergency Exits Tab */}
        {!isLoading && !error && data && activeTab === 'emergency' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Emergency Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ended At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.emergencyExits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No emergency exits recorded
                      </td>
                    </tr>
                  ) : (
                    data.emergencyExits.map((exit) => (
                      <tr key={exit.id} className={`hover:bg-gray-50 ${exit.badgeType === 'emergency_exit' ? 'bg-red-50' : ''}`}>
                        <td className="px-4 py-3">{getEmergencyBadge(exit.badgeType)}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium text-gray-900">{exit.userNickname || exit.userName}</span>
                            {exit.userNickname && exit.userName && exit.userNickname !== exit.userName && (
                              <span className="text-xs text-gray-500 ml-1">({exit.userName})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{exit.userPhone}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm text-gray-900">{exit.dateName}</span>
                            {exit.datePhone && (
                              <div className="text-xs text-gray-500">{exit.datePhone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>
                            {exit.locationType && <span className="font-medium">{exit.locationType}</span>}
                            {exit.address && <div className="text-xs text-gray-500 truncate max-w-[200px]">{exit.address}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>
                            {exit.emergencyContactName && <span>{exit.emergencyContactName}</span>}
                            {exit.emergencyContactPhone && (
                              <div className="text-xs text-gray-500">{exit.emergencyContactPhone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(exit.endedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logout Users Tab */}
        {!isLoading && !error && data && activeTab === 'logout' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Logout Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.logoutUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No recent logouts recorded
                      </td>
                    </tr>
                  ) : (
                    data.logoutUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{user.nickname}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-4 py-3">{getSubscriptionBadge(user.subscriptionStatus)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(user.logoutAt)}</td>
                        <td className="px-4 py-3">{getReasonBadge(user.reason)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Downgraded Users Tab */}
        {!isLoading && !error && data && activeTab === 'downgraded' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Previous</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Current</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.downgradedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No subscription downgrades recorded
                      </td>
                    </tr>
                  ) : (
                    data.downgradedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{user.nickname}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            {user.previousStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                            {user.newStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(user.downgradedAt)}</td>
                        <td className="px-4 py-3">{getReasonBadge(user.reason)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Inactive Users Tab */}
        {!isLoading && !error && data && activeTab === 'inactive' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Search</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Days Inactive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.inactiveUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No inactive users found
                      </td>
                    </tr>
                  ) : (
                    data.inactiveUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{user.nickname}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-4 py-3">{getSubscriptionBadge(user.subscriptionStatus)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {user.lastSearchAt ? formatDate(user.lastSearchAt) : 'Never'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.daysInactive > 30
                              ? 'bg-red-100 text-red-700'
                              : user.daysInactive > 14
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
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
          </div>
        )}
      </div>
    </div>
  );
}
