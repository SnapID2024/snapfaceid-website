'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface PromoCode {
  id: string;
  code: string;
  phone: string;
  user_id?: string;
  user_name?: string;
  notes?: string;
  created_at: string;
  expires_at: string;
  redeemed_at?: string;
  status: 'pending' | 'active' | 'expired' | 'revoked';
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  expired: number;
  revoked: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.snapfaceid.com';

export default function PromoCodesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create promo form
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Get auth header
  const getAuthHeader = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const username = localStorage.getItem('admin_username') || '';
    const password = localStorage.getItem('admin_password') || '';
    return 'Basic ' + btoa(`${username}:${password}`);
  }, []);

  // Check auth
  useEffect(() => {
    const username = localStorage.getItem('admin_username');
    const password = localStorage.getItem('admin_password');
    if (!username || !password) {
      router.push('/admin');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  // Fetch codes
  const fetchCodes = useCallback(async () => {
    try {
      const url = statusFilter === 'all'
        ? `${BACKEND_URL}/admin/promo-codes/list`
        : `${BACKEND_URL}/admin/promo-codes/list?status=${statusFilter}`;

      const response = await fetch(url, {
        headers: { 'Authorization': getAuthHeader() }
      });

      if (!response.ok) throw new Error('Failed to fetch codes');
      const data = await response.json();
      setCodes(data.codes || []);
    } catch (err) {
      setError('Failed to load promo codes');
    }
  }, [getAuthHeader, statusFilter]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/admin/promo-codes/stats`, {
        headers: { 'Authorization': getAuthHeader() }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [getAuthHeader]);

  // Load data
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCodes(), fetchStats()]);
      setLoading(false);
    };

    loadData();
  }, [isAuthenticated, fetchCodes, fetchStats]);

  // Reload when filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchCodes();
    }
  }, [statusFilter, isAuthenticated, fetchCodes]);

  // Create promo code
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!phone.trim()) {
      setError('Phone number is required');
      return;
    }

    // Validate phone format
    const cleanPhone = phone.trim();
    if (!cleanPhone.startsWith('+')) {
      setError('Phone must start with + (e.g., +1234567890)');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${BACKEND_URL}/admin/promo-codes/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': getAuthHeader()
        },
        body: JSON.stringify({
          phone: cleanPhone,
          notes: notes.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create promo code');
      }

      setSuccess(`Promo code created: ${data.code}`);
      setPhone('');
      setNotes('');

      // Reload data
      fetchCodes();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create code');
    } finally {
      setCreating(false);
    }
  };

  // Revoke code
  const handleRevoke = async (code: string) => {
    if (!confirm(`Are you sure you want to revoke code ${code}? This will also remove Premium from the user if already redeemed.`)) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/admin/promo-codes/revoke/${code}`, {
        method: 'POST',
        headers: { 'Authorization': getAuthHeader() }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to revoke code');
      }

      setSuccess(`Code ${code} has been revoked`);
      fetchCodes();
      fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke code');
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      revoked: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#6A1B9A] to-[#8E24AA] text-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Promo Codes</h1>
            <p className="text-white/80 text-sm">Manage promotional codes for influencers</p>
          </div>
          <a
            href="/admin/dashboard"
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-sm"
          >
            Back to Dashboard
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
              <div className="text-sm text-gray-500">Total</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
              <div className="text-sm text-gray-500">Expired</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
              <div className="text-sm text-gray-500">Revoked</div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {success}
          </div>
        )}

        {/* Create Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Create Promo Code</h2>
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (E.164 format)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Influencer name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-[#6A1B9A] text-white rounded-lg hover:bg-[#5a1680] transition-colors disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </form>
          <p className="mt-3 text-sm text-gray-500">
            The code will grant 30 days of Premium access when the user redeems it in the app.
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'active', 'expired', 'revoked'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-[#6A1B9A] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Codes List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : codes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No promo codes found. Create one above!
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-[#6A1B9A]">{code.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{code.user_name || 'Unknown'}</div>
                        <div className="text-gray-500">{code.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {code.notes || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(code.status)}`}>
                        {code.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(code.created_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(code.expires_at)}
                    </td>
                    <td className="px-4 py-3">
                      {(code.status === 'pending' || code.status === 'active') && (
                        <button
                          onClick={() => handleRevoke(code.code)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
