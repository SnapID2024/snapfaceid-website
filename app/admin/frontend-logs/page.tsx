'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

interface PhoneEntry {
  phone_key: string;
  phone: string;
  last_log: string | null;
  user_id: string | null;
}

interface LogEntry {
  id: string;
  timestamp: string;
  unix_timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: string | null;
  data: Record<string, unknown> | null;
  phone: string;
  user_id: string | null;
  device: string;
}

type FilterLevel = 'all' | 'info' | 'warn' | 'error' | 'debug';

export default function FrontendLogsPage() {
  const router = useRouter();
  const [phones, setPhones] = useState<PhoneEntry[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingPhones, setIsLoadingPhones] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('all');
  const [isClearing, setIsClearing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Get admin token from localStorage
  const getToken = () => localStorage.getItem('adminToken');

  // Fetch list of phones that have logs
  const fetchPhones = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push('/admin');
      return;
    }

    setIsLoadingPhones(true);
    try {
      const response = await fetch('/api/admin/frontend-logs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        router.push('/admin');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch phones');
      const data = await response.json();
      setPhones(data.phones || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching phones');
    } finally {
      setIsLoadingPhones(false);
    }
  }, [router]);

  // Fetch logs for selected phone
  const fetchLogs = useCallback(async (phoneKey: string) => {
    const token = getToken();
    if (!token) return;

    setIsLoadingLogs(true);
    try {
      const levelParam = filterLevel !== 'all' ? `?level=${filterLevel}` : '';
      const response = await fetch(`/api/admin/frontend-logs/${phoneKey}${levelParam}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching logs');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [filterLevel]);

  // Clear logs for a phone
  const clearLogs = async (phoneKey: string) => {
    const token = getToken();
    if (!token) return;

    if (!confirm(`Are you sure you want to clear all logs for ${phoneKey}?`)) return;
    setIsClearing(true);
    try {
      const response = await fetch(`/api/admin/frontend-logs/${phoneKey}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to clear logs');
      setLogs([]);
      fetchPhones(); // Refresh phone list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error clearing logs');
    } finally {
      setIsClearing(false);
    }
  };

  // Initial load
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchPhones();
  }, [router, fetchPhones]);

  // Fetch logs when phone selection or filter changes
  useEffect(() => {
    if (selectedPhone) {
      fetchLogs(selectedPhone);
    }
  }, [selectedPhone, filterLevel, fetchLogs]);

  // Auto-refresh logs every 5 seconds if enabled
  useEffect(() => {
    if (!autoRefresh || !selectedPhone) return;
    const interval = setInterval(() => {
      fetchLogs(selectedPhone);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedPhone, fetchLogs]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800',
      warn: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getLevelIcon = (level: string) => {
    const icons: Record<string, string> = {
      info: 'i',
      warn: '!',
      error: 'x',
      debug: 'D',
    };
    return icons[level] || '?';
  };

  const selectedPhoneData = phones.find(p => p.phone_key === selectedPhone);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <img src={LOGO_URL} alt="SnapFaceID Logo" className="h-10 w-auto cursor-pointer" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Frontend Logs</h1>
                <p className="text-sm text-gray-500">Debug logs from mobile app by phone number</p>
              </div>
            </div>
            <Link
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Phone List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">Phones with Logs</h2>
                <button
                  onClick={fetchPhones}
                  className="text-sm text-purple-600 hover:text-purple-800 mt-1"
                >
                  Refresh List
                </button>
              </div>

              {isLoadingPhones ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : phones.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No logs yet</div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {phones.map((phone) => (
                    <button
                      key={phone.phone_key}
                      onClick={() => setSelectedPhone(phone.phone_key)}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedPhone === phone.phone_key ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900 text-sm">
                        {phone.phone || phone.phone_key}
                      </div>
                      {phone.last_log && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last: {formatTimestamp(phone.last_log)}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logs Panel */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Logs Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {selectedPhoneData ? (
                        <>Logs for {selectedPhoneData.phone || selectedPhone}</>
                      ) : (
                        <>Select a phone to view logs</>
                      )}
                    </h2>
                    {selectedPhone && (
                      <div className="text-sm text-gray-500">{logs.length} entries</div>
                    )}
                  </div>

                  {selectedPhone && (
                    <div className="flex items-center gap-3">
                      {/* Level Filter */}
                      <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value as FilterLevel)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1"
                      >
                        <option value="all">All Levels</option>
                        <option value="error">Errors Only</option>
                        <option value="warn">Warnings</option>
                        <option value="info">Info</option>
                        <option value="debug">Debug</option>
                      </select>

                      {/* Auto Refresh Toggle */}
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={(e) => setAutoRefresh(e.target.checked)}
                          className="rounded border-gray-300 text-purple-600"
                        />
                        Auto-refresh
                      </label>

                      {/* Refresh Button */}
                      <button
                        onClick={() => fetchLogs(selectedPhone)}
                        disabled={isLoadingLogs}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        Refresh
                      </button>

                      {/* Clear Button */}
                      <button
                        onClick={() => clearLogs(selectedPhone)}
                        disabled={isClearing}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        Clear Logs
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Logs Content */}
              <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
                {!selectedPhone ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📱</div>
                    <p>Select a phone number from the left to view its logs</p>
                  </div>
                ) : isLoadingLogs ? (
                  <div className="p-8 text-center text-gray-500">Loading logs...</div>
                ) : logs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>No logs found for this phone</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {logs.map((log) => (
                      <div key={log.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          {/* Level Badge */}
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${getLevelBadge(
                              log.level
                            )}`}
                          >
                            {getLevelIcon(log.level)}
                          </span>

                          {/* Log Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(log.timestamp)}
                              </span>
                              {log.context && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                  {log.context}
                                </span>
                              )}
                              {log.device && (
                                <span className="text-xs text-gray-400">{log.device}</span>
                              )}
                            </div>

                            <div className={`text-sm ${log.level === 'error' ? 'text-red-700 font-medium' : 'text-gray-900'}`}>
                              {log.message}
                            </div>

                            {log.data && Object.keys(log.data).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                  Show data
                                </summary>
                                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-700 overflow-x-auto">
                                  {JSON.stringify(log.data, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
