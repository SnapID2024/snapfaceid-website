'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

interface ReportedReviewContent {
  review_id: string;
  preset_1_text: string | null;
  preset_2_text: string | null;
  review_type: string;
  author_username: string;
  author_uid: string;
  author_phone: string;
  location: string;
  created_at: string;
}

interface Complaint {
  complaint_id: string;
  user_id: string;
  user_phone: string;
  user_name: string;
  person_id: string;
  person_phone: string;
  review_ids: string[];
  reported_reviews_content: ReportedReviewContent[];
  reason: string;
  report_type: 'free' | 'priority';
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  identity_verified: boolean;
  created_at: string;
  expected_resolution: string;
  admin_notes: string;
  resolved_at: string | null;
  resolution_outcome: string | null;
  stripe_verification_status?: string;
}

type FilterStatus = 'all' | 'pending' | 'in_review' | 'approved' | 'rejected';

export default function ComplaintsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const fetchComplaints = useCallback(async (token: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(`/api/admin/complaints${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch complaints');
      }

      const result = await response.json();
      setComplaints(result.complaints || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching complaints');
    } finally {
      setIsLoading(false);
    }
  }, [router, filterStatus]);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchComplaints(token);
  }, [router, fetchComplaints]);

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
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      in_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const labels: Record<string, string> = {
      pending: 'Pending',
      in_review: 'In Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === 'priority') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
          Priority ($20)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
        Free
      </span>
    );
  };

  const getVerificationBadge = (complaint: Complaint) => {
    if (complaint.report_type === 'priority' && complaint.identity_verified) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
          Paid + ID Verified
        </span>
      );
    }
    if (complaint.report_type === 'priority') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
          Paid (Awaiting ID)
        </span>
      );
    }
    if (complaint.identity_verified) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
          ID Verified
        </span>
      );
    }
    if (complaint.stripe_verification_status === 'failed') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
          Verification Failed
        </span>
      );
    }
    if (complaint.stripe_verification_status === 'requires_input') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
          Needs Retry
        </span>
      );
    }
    if (complaint.stripe_verification_status === 'processing') {
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 animate-pulse">
          Processing...
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400">
        Not Verified
      </span>
    );
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: 'in_review' | 'approved' | 'rejected') => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/complaints/${complaintId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update complaint');
      }

      // Refresh the list
      await fetchComplaints(token, false);
      setSelectedComplaint(null);
      setAdminNotes('');
      setNotesSaved(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating complaint');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async (complaintId: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_notes: adminNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save notes');
      }

      setNotesSaved(true);
      // Update the selected complaint with new notes
      if (selectedComplaint) {
        setSelectedComplaint({ ...selectedComplaint, admin_notes: adminNotes });
      }
      // Refresh the list in background
      await fetchComplaints(token, false);

      // Reset saved indicator after 2 seconds
      setTimeout(() => setNotesSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error saving notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const pendingCount = complaints.filter(c => c.status === 'pending' || c.status === 'in_review').length;

  return (
    <div className="min-h-screen bg-gray-800">
      {/* Header */}
      <header className="bg-gray-700 border-b border-gray-600 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="SnapFace ID" className="h-8" />
              <div className="h-5 w-px bg-gray-500" />
              <h1 className="text-lg font-bold text-white">Complaints</h1>
              {pendingCount > 0 && (
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount} pending
                </span>
              )}
              {lastUpdated && (
                <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const token = localStorage.getItem('adminToken');
                  if (token) fetchComplaints(token);
                }}
                className="text-sm text-gray-300 hover:text-white bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                Refresh
              </button>
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'in_review', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filterStatus === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <div className="bg-gray-700 rounded-xl p-12 text-center">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading complaints...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                const token = localStorage.getItem('adminToken');
                if (token) fetchComplaints(token);
              }}
              className="mt-3 text-sm text-purple-400 hover:text-purple-300"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && complaints.length === 0 && (
          <div className="bg-gray-700 rounded-xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400">No complaints found</p>
          </div>
        )}

        {!isLoading && !error && complaints.length > 0 && (
          <div className="bg-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-600/50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Reason</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Reviews</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Verification</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-600/50">
                  {complaints.map((complaint) => (
                    <tr key={complaint.complaint_id} className="hover:bg-gray-600/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-white">{complaint.user_name}</p>
                          <p className="text-xs text-gray-400">{complaint.user_phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getTypeBadge(complaint.report_type)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-300 max-w-xs truncate" title={complaint.reason}>
                          {complaint.reason}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-300">
                          {complaint.review_ids?.length || 0} review(s)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getVerificationBadge(complaint)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(complaint.status)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400">
                          {formatDate(complaint.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setAdminNotes(complaint.admin_notes || '');
                          }}
                          className="text-sm text-purple-400 hover:text-purple-300"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Complaint Details</h2>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Reporter</h3>
                <p className="text-white">{selectedComplaint.user_name}</p>
                <p className="text-sm text-gray-400">{selectedComplaint.user_phone}</p>
                <p className="text-xs text-gray-500 mt-1">ID: {selectedComplaint.user_id}</p>
              </div>

              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Report Type</h3>
                  {getTypeBadge(selectedComplaint.report_type)}
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Verification</h3>
                  {getVerificationBadge(selectedComplaint)}
                </div>
              </div>

              {/* Reason */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Reason for Report</h3>
                <p className="text-white">{selectedComplaint.reason}</p>
              </div>

              {/* Reviews */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Reported Reviews</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mb-3">
                  <span>Person ID: <span className="text-gray-300">{selectedComplaint.person_id}</span></span>
                  {selectedComplaint.person_phone && (
                    <span>
                      Phone: <a href={`tel:${selectedComplaint.person_phone}`} className="text-purple-400 hover:text-purple-300">{selectedComplaint.person_phone}</a>
                    </span>
                  )}
                </div>

                {/* Actual Review Content */}
                <div className="space-y-3">
                  {selectedComplaint.reported_reviews_content?.length > 0 ? (
                    selectedComplaint.reported_reviews_content.map((review, idx) => (
                      <div key={review.review_id} className="bg-gray-600/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-purple-400 font-medium">
                            Review {idx + 1} - {review.review_type === 'inperson' ? 'En Persona' : 'Remota'}
                          </span>
                          <div className="text-right">
                            <span className="text-xs text-gray-400 block">by {review.author_username}</span>
                            {review.author_phone && (
                              <a href={`tel:${review.author_phone}`} className="text-xs text-purple-400 hover:text-purple-300">
                                {review.author_phone}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {review.preset_1_text && (
                            <p className="text-sm text-white">{review.preset_1_text}</p>
                          )}
                          {review.preset_2_text && (
                            <p className="text-sm text-white">{review.preset_2_text}</p>
                          )}
                        </div>
                        {review.location && (
                          <p className="text-xs text-gray-500 mt-2">📍 {review.location}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      {selectedComplaint.review_ids?.map((id, idx) => (
                        <span key={id} className="block">Review {idx + 1}: {id.substring(0, 12)}...</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{formatDate(selectedComplaint.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Expected Resolution:</span>
                    <span className="text-white">{formatDate(selectedComplaint.expected_resolution)}</span>
                  </div>
                  {selectedComplaint.resolved_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Resolved:</span>
                      <span className="text-white">{formatDate(selectedComplaint.resolved_at)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300">Admin Notes</label>
                  <div className="flex items-center gap-2">
                    {notesSaved && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved
                      </span>
                    )}
                    <button
                      onClick={() => handleSaveNotes(selectedComplaint.complaint_id)}
                      disabled={isSavingNotes || adminNotes === (selectedComplaint.admin_notes || '')}
                      className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingNotes ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={adminNotes}
                  onChange={(e) => {
                    setAdminNotes(e.target.value);
                    setNotesSaved(false);
                  }}
                  placeholder="Add notes about this complaint for future reference..."
                  className="w-full bg-gray-700 text-white rounded-lg p-3 text-sm border border-gray-600 focus:border-purple-500 focus:outline-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              {selectedComplaint.status !== 'approved' && selectedComplaint.status !== 'rejected' && (
                <div className="flex gap-3">
                  {selectedComplaint.status === 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedComplaint.complaint_id, 'in_review')}
                      disabled={isUpdating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? 'Updating...' : 'Mark In Review'}
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateStatus(selectedComplaint.complaint_id, 'approved')}
                    disabled={isUpdating || !selectedComplaint.identity_verified}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    title={!selectedComplaint.identity_verified ? 'Identity must be verified first' : ''}
                  >
                    {isUpdating ? 'Updating...' : 'Approve (Remove Reviews)'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedComplaint.complaint_id, 'rejected')}
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? 'Updating...' : 'Reject'}
                  </button>
                </div>
              )}

              {selectedComplaint.status === 'approved' && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-center">
                  <p className="text-green-400 font-medium">This complaint has been approved</p>
                  <p className="text-sm text-green-500/70 mt-1">
                    The reported reviews have been removed from the person&apos;s profile.
                  </p>
                </div>
              )}

              {selectedComplaint.status === 'rejected' && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-center">
                  <p className="text-red-400 font-medium">This complaint has been rejected</p>
                  <p className="text-sm text-red-500/70 mt-1">
                    No action was taken on the reported reviews.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
