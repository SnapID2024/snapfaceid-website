'use client';

import React, { useState } from 'react';

interface UserResult {
  id: string;
  phone: string;
  username: string;
  avatarUrl?: string;
  presetAvatarId?: number;
  subscriptionType: 'free' | 'premium' | 'trusted';
  isTrusted: boolean;
}

interface TrustedUsersManagerProps {
  onBack: () => void;
}

const TrustedUsersManager: React.FC<TrustedUsersManagerProps> = ({ onBack }) => {
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<UserResult | null>(null);
  const [error, setError] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = async () => {
    if (!searchPhone.trim()) {
      setError('Ingresa un número de teléfono');
      return;
    }

    // Normalize phone number
    let phone = searchPhone.trim();
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    setIsSearching(true);
    setError('');
    setSearchResult(null);
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/trusted-users/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (data.found) {
        setSearchResult(data.user);
      } else {
        setError(data.error || 'Usuario no encontrado');
      }
    } catch {
      setError('Error de conexión');
    }

    setIsSearching(false);
  };

  const handleToggleTrusted = async () => {
    if (!searchResult) return;

    setIsToggling(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/admin/trusted-users/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odId: searchResult.id,
          phone: searchResult.phone,
          setTrusted: !searchResult.isTrusted,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResult({
          ...searchResult,
          isTrusted: !searchResult.isTrusted,
          subscriptionType: !searchResult.isTrusted ? 'trusted' : 'premium',
        });
        setSuccessMessage(
          !searchResult.isTrusted
            ? 'Usuario activado como Trusted'
            : 'Usuario removido de Trusted'
        );
      } else {
        setError(data.error || 'Error al actualizar');
      }
    } catch {
      setError('Error de conexión');
    }

    setIsToggling(false);
  };

  const getAvatarUrl = (user: UserResult): string => {
    if (user.avatarUrl) return user.avatarUrl;
    if (user.presetAvatarId) return `/avatars/${user.presetAvatarId}.png`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || 'U')}&background=6A1B9A&color=fff&size=80`;
  };

  const getStatusBadge = (user: UserResult) => {
    if (user.isTrusted) {
      return (
        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
          Trusted
        </span>
      );
    }
    if (user.subscriptionType === 'premium') {
      return (
        <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
          Premium
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded-full">
        Gratis
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h3 className="text-white font-semibold">Gestionar Usuarios Trusted</h3>
          <p className="text-gray-500 text-xs">Buscar por número de teléfono</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="tel"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="+1 786 449 0937"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
          >
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Formato: +1XXXXXXXXXX (incluir código de país)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg">
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Search Result */}
      {searchResult && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-4">
            {/* Avatar with Trusted Badge */}
            <div className="relative">
              <img
                src={getAvatarUrl(searchResult)}
                alt={searchResult.username}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-600"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(searchResult.username || 'U')}&background=6A1B9A&color=fff&size=80`;
                }}
              />
              {/* Trusted Badge */}
              {searchResult.isTrusted && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-white font-semibold">{searchResult.username || 'Sin nombre'}</p>
                {getStatusBadge(searchResult)}
              </div>
              <p className="text-gray-400 text-sm">{searchResult.phone}</p>
            </div>
          </div>

          {/* Toggle Button */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            {searchResult.subscriptionType === 'free' ? (
              <p className="text-yellow-400 text-sm text-center">
                Este usuario no tiene suscripción Premium
              </p>
            ) : (
              <button
                onClick={handleToggleTrusted}
                disabled={isToggling}
                className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  searchResult.isTrusted
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-green-600 hover:bg-green-500 text-white'
                }`}
              >
                {isToggling ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </span>
                ) : searchResult.isTrusted ? (
                  'Remover de Trusted'
                ) : (
                  'Activar como Trusted'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Instructions when no search */}
      {!searchResult && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm">Busca un usuario por su número de teléfono</p>
            <p className="text-xs mt-1">Solo usuarios Premium pueden ser Trusted</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustedUsersManager;
