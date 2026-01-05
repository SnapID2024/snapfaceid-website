'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

interface TrustedValidationLog {
  id: string;
  userId: string;
  userPhone: string;
  username: string;
  linkProvided: string;
  scrapedName: string;
  scrapedPhone: string;
  verificationCode: string;
  status: 'pending' | 'code_sent' | 'verified' | 'failed' | 'blocked';
  attemptsUsed: number;
  maxAttempts: number;
  codeExpiresAt: string | null;
  createdAt: string;
  verifiedAt: string | null;
  errorMessage: string | null;
}

interface TrustedValidationData {
  logs: TrustedValidationLog[];
  total: number;
  stats: {
    pending: number;
    codeSent: number;
    verified: number;
    failed: number;
    blocked: number;
  };
}

export default function TrustedValidationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrustedValidationData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchData = useCallback(async (token: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/trusted-validation', {
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

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('adminToken');
      if (currentToken) fetchData(currentToken, false);
    }, 30000);

    return () => clearInterval(interval);
  }, [router, fetchData]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-600/30 text-yellow-400">Pending</span>;
      case 'code_sent':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-blue-600/30 text-blue-400">Code Sent</span>;
      case 'verified':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-green-600/30 text-green-400">Verified</span>;
      case 'failed':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-red-600/30 text-red-400">Failed</span>;
      case 'blocked':
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-300">Blocked</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-400">{status}</span>;
    }
  };

  const filteredLogs = data?.logs.filter(log => {
    if (activeFilter === 'all') return true;
    return log.status === activeFilter;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="bg-gray-700 border-b border-gray-600 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="SnapFace ID" className="h-8" />
              <div className="h-5 w-px bg-gray-500" />
              <h1 className="text-lg font-bold text-white">Trusted Validation</h1>
              {lastUpdated && (
                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
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
                className="flex items-center gap-1 text-sm text-gray-300 hover:text-white bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded-lg transition-colors"
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
              { label: 'Pending', value: data.stats.pending, color: 'yellow', filter: 'pending' },
              { label: 'Code Sent', value: data.stats.codeSent, color: 'blue', filter: 'code_sent' },
              { label: 'Verified', value: data.stats.verified, color: 'green', filter: 'verified' },
              { label: 'Failed', value: data.stats.failed, color: 'red', filter: 'failed' },
              { label: 'Blocked', value: data.stats.blocked, color: 'gray', filter: 'blocked' },
            ].map((stat) => (
              <button
                key={stat.label}
                onClick={() => setActiveFilter(activeFilter === stat.filter ? 'all' : stat.filter)}
                className={`bg-gray-700 rounded-lg p-3 border-l-4 text-left transition-all ${
                  stat.color === 'yellow' ? 'border-yellow-500' :
                  stat.color === 'blue' ? 'border-blue-500' :
                  stat.color === 'green' ? 'border-green-500' :
                  stat.color === 'red' ? 'border-red-500' :
                  'border-gray-500'
                } ${activeFilter === stat.filter ? 'ring-2 ring-purple-500' : ''}`}
              >
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        {isLoading && (
          <div className="bg-gray-700 rounded-xl p-12 text-center">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading validation logs...</p>
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

        {!isLoading && !error && data && (
          <div className="bg-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-600/50 text-left">
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">User Phone</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Username</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Scraped Name</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Scraped Phone</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Link</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Attempts</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        {activeFilter === 'all' ? 'No validation logs found' : `No ${activeFilter} validations`}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-600/50">
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-300 font-mono">{log.userPhone || '—'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm font-medium text-white">{log.username || '—'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm text-green-400">{log.scrapedName || '—'}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-300 font-mono">{log.scrapedPhone || '—'}</span>
                        </td>
                        <td className="px-3 py-3">
                          {log.linkProvided ? (
                            <a
                              href={log.linkProvided}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:text-purple-300 truncate block max-w-[150px]"
                              title={log.linkProvided}
                            >
                              {log.linkProvided.replace(/^https?:\/\//, '').substring(0, 25)}...
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-sm font-mono ${log.attemptsUsed >= log.maxAttempts ? 'text-red-400' : 'text-gray-400'}`}>
                            {log.attemptsUsed}/{log.maxAttempts}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {getStatusBadge(log.status)}
                          {log.errorMessage && (
                            <div className="text-xs text-red-400 mt-1" title={log.errorMessage}>
                              {log.errorMessage.substring(0, 20)}...
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-sm text-gray-400">{formatDate(log.createdAt)}</span>
                          {log.verifiedAt && (
                            <div className="text-xs text-green-400">Verified: {formatDate(log.verifiedAt)}</div>
                          )}
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
