'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

// Mapeo de presets a texto (los mismos que en email_service.py)
const PRESET_TEXTS: Record<number, string> = {
  1: "Buena persona en general (nada raro)",
  2: "Persona nerviosa completo su cita (se fue rapido)",
  3: "Muy generoso (me dejo regalo extra)",
  4: "Perdida de tiempo total (no se presento a la cita)",
  5: "Me pago un Uber para desperdiciar mi tiempo",
  6: "No respeta mi tiempo ni mi compromiso",
  7: "En nuestro encuentro perdi mi dinero o joyas",
  8: "Esta persona es peligrosa y me senti en peligro inminente",
  9: "Colector de fotos y direcciones (perdida de tiempo)",
  10: "Trabaja para una institucion del gobierno",
  11: "Payaso sin dinero que te molesta tarde en la noche",
  12: "Mintio sobre su edad legal y lo rechace",
  13: "Muy agresivo verbalmente",
  14: "No quiere pasar proceso de verificacion",
  15: "Solo usa lenguaje inapropiado o muy grafico",
  16: "Envia fotos de sus partes privadas inapropiadamente",
  17: "Hace preguntas sexuales inapropiadas desde el primer contacto",
  18: "No esta dispuesto a cubrir gastos basicos de la cita",
  19: "Solo sugiere lugares de bajo presupuesto o informales",
  20: "Hace planes pero no concreta nada (Perdida de tiempo)",
  21: "Esta casado o en una relacion sentimental",
  22: "No interactuo con nadie de su comunidad todos son rudos",
  23: "Solo busca contenido intimo sin intencion de conocerme",
  24: "Persona de fisico feo, pero muy buena persona",
  25: "Persona fisicamente desagradable al igual que su personalidad",
  26: "Persona muy sexy y agradable",
  27: "Persona muy arrogante y dificil de tratar",
  28: "Se pasa muy buen tiempo con esta persona, muy recomendable",
  29: "Parece estar bajo influencia de narcoticos",
  30: "No es la misma persona de las fotos",
  31: "Es la misma persona de las fotos 100% recomendada",
  33: "Operativo de la policia local que me confundio con un criminal",
  34: "Sale huyendo del restaurante sin pagar la cuenta",
  35: "Parece ser una persona segura y educada",
  36: "No he visto en persona, pero siempre me envia regalos",
  37: "Estafador tratando de sacarte dinero",
  38: "Persona muy inmadura, habla cosas sin sentido",
  39: "No quiere hacer FaceTime o enviar fotos de verificacion",
  40: "Trabaja en la policia y siempre esta ocupado",
};

interface ModerationItem {
  id: string;
  person_id: string;
  phone_number: string;
  reviewer_uid: string;
  reviewer_username: string;
  reviewer_avatar_url: string | null;
  reviewer_preset_avatar_id: number | null;
  reviewer_phone: string | null;
  review_preset_1: number | null;
  review_preset_2: number | null;
  knows_in_person: boolean;
  pending_selfie_url: string;
  profile_selfie_url: string | null;
  approve_token: string;
  reject_token: string;
  status: 'unread' | 'read' | 'approved' | 'rejected';
  created_at: string;
  moderated_at: string | null;
  moderated_via: string | null;
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function MailInboxPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchItems = useCallback(async (token: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const statusParam = filterStatus !== 'all' ? `?status_filter=${filterStatus}` : '';
      const response = await fetch(`/api/admin/moderation/inbox${statusParam}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          router.push('/admin');
          return;
        }
        throw new Error('Failed to fetch moderation inbox');
      }

      const result = await response.json();
      setItems(result.items || []);
      setUnreadCount(result.unread_count || 0);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching inbox');
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
    fetchItems(token);
  }, [router, fetchItems]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const interval = setInterval(() => {
      fetchItems(token, false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchItems]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
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
      unread: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      read: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const labels: Record<string, string> = {
      unread: 'Unread',
      read: 'Read',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleSelectItem = async (item: ModerationItem) => {
    setSelectedItem(item);

    // Mark as read if unread
    if (item.status === 'unread') {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      try {
        await fetch(`/api/admin/moderation/mark-read/${item.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        // Update local state
        setItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, status: 'read' as const } : i
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedItem) return;

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/moderation/action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moderation_id: selectedItem.id,
          action: action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process action');
      }

      const result = await response.json();

      // Update local state
      setItems(prev => prev.map(i =>
        i.id === selectedItem.id ? { ...i, status: action === 'approve' ? 'approved' : 'rejected' } : i
      ));

      // Close detail view if filtering by pending
      if (filterStatus === 'pending') {
        setSelectedItem(null);
      } else {
        setSelectedItem({ ...selectedItem, status: action === 'approve' ? 'approved' : 'rejected' });
      }

      alert(result.message);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error processing action');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPresetText = (presetId: number | null) => {
    if (!presetId) return null;
    return PRESET_TEXTS[presetId] || `Preset #${presetId}`;
  };

  // Download image function (uses server-side proxy to bypass CORS)
  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      alert('Session expired. Please login again.');
      router.push('/admin');
      return;
    }

    try {
      const proxyUrl = `/api/admin/download-image?url=${encodeURIComponent(imageUrl)}&filename=${encodeURIComponent(filename)}`;
      const response = await fetch(proxyUrl, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to download image');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading image:', err);
      alert('Error downloading image. Try right-click and "Save image as..."');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="flex items-center gap-2">
                <Image
                  src={LOGO_URL}
                  alt="SnapfaceID"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-white font-semibold hidden sm:block">Mail Inbox</span>
              </Link>
              {unreadCount > 0 && (
                <span className="bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Back to Dashboard
              </Link>
              {lastUpdated && (
                <span className="text-gray-500 text-xs">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'all', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setSelectedItem(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-pink-600 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              }`}
            >
              {status === 'pending' ? 'Pending' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Content */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List */}
            <div className="space-y-4">
              <h2 className="text-white font-semibold text-lg">
                {filterStatus === 'pending' ? 'Pending Reviews' : `${filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)} Reviews`}
                <span className="text-gray-500 text-sm ml-2">({items.length})</span>
              </h2>

              {items.length === 0 ? (
                <div className="bg-white/5 rounded-xl p-8 text-center">
                  <p className="text-gray-400">No items found</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      className={`bg-white/5 rounded-xl p-4 cursor-pointer transition-all hover:bg-white/10 border ${
                        selectedItem?.id === item.id
                          ? 'border-pink-500'
                          : item.status === 'unread'
                          ? 'border-pink-500/50'
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                          {item.pending_selfie_url ? (
                            <img
                              src={item.pending_selfie_url}
                              alt="Pending selfie"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              No img
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium truncate">
                              {item.reviewer_username || 'Unknown'}
                            </span>
                            {getStatusBadge(item.status)}
                            {item.knows_in_person && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                                Knows in person
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">
                            Phone: {item.phone_number}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detail Panel */}
            <div className="lg:sticky lg:top-24">
              {selectedItem ? (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-white font-semibold text-lg mb-4">Review Details</h3>

                  {/* Images Comparison */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Pending Selfie</p>
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 border-2 border-pink-500">
                        {selectedItem.pending_selfie_url ? (
                          <img
                            src={selectedItem.pending_selfie_url}
                            alt="Pending selfie"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            No image
                          </div>
                        )}
                      </div>
                      {selectedItem.pending_selfie_url && (
                        <button
                          onClick={() => handleDownloadImage(
                            selectedItem.pending_selfie_url,
                            `pending-selfie-${selectedItem.phone_number}-${Date.now()}.jpg`
                          )}
                          className="w-full mt-2 bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Profile Selfie</p>
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-700 border-2 border-blue-500">
                        {selectedItem.profile_selfie_url ? (
                          <img
                            src={selectedItem.profile_selfie_url}
                            alt="Profile selfie"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm text-center p-2">
                            No previous photo
                          </div>
                        )}
                      </div>
                      {selectedItem.profile_selfie_url && (
                        <button
                          onClick={() => handleDownloadImage(
                            selectedItem.profile_selfie_url!,
                            `profile-selfie-${selectedItem.phone_number}-${Date.now()}.jpg`
                          )}
                          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviewer:</span>
                      <span className="text-white">{selectedItem.reviewer_username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reviewer Phone:</span>
                      <span className="text-white">{selectedItem.reviewer_phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Person Phone:</span>
                      <span className="text-white">{selectedItem.phone_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Knows in Person:</span>
                      <span className={selectedItem.knows_in_person ? 'text-green-400' : 'text-gray-500'}>
                        {selectedItem.knows_in_person ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created:</span>
                      <span className="text-white">{formatDate(selectedItem.created_at)}</span>
                    </div>
                    {selectedItem.moderated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Moderated:</span>
                        <span className="text-white">
                          {formatDate(selectedItem.moderated_at)}
                          {selectedItem.moderated_via && ` (via ${selectedItem.moderated_via})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Review Presets */}
                  <div className="bg-white/5 rounded-lg p-4 mb-6">
                    <h4 className="text-white font-medium mb-2">Review Selections:</h4>
                    <ul className="space-y-2 text-sm">
                      {selectedItem.review_preset_1 && (
                        <li className="text-gray-300">
                          {getPresetText(selectedItem.review_preset_1)}
                        </li>
                      )}
                      {selectedItem.review_preset_2 && selectedItem.review_preset_2 !== 0 && (
                        <li className="text-gray-300">
                          {getPresetText(selectedItem.review_preset_2)}
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Knows in Person Note */}
                  {selectedItem.knows_in_person && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                      <p className="text-green-400 text-sm">
                        <strong>Note:</strong> The reviewer claims to know this person in real life.
                        Less likely to be an AI-generated image, but should still be verified.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {(selectedItem.status === 'unread' || selectedItem.status === 'read') && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAction('approve')}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction('reject')}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}

                  {/* Already Processed */}
                  {(selectedItem.status === 'approved' || selectedItem.status === 'rejected') && (
                    <div className={`text-center py-3 rounded-lg ${
                      selectedItem.status === 'approved'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      This review has been {selectedItem.status}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-8 text-center border border-white/10">
                  <p className="text-gray-400">Select an item to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
