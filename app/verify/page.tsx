'use client';

import { useState, useEffect } from 'react';

type VerifyState = 'input' | 'agreement' | 'viewing';

interface ProfileData {
  person_id: string;
  selfies: string[];
  numeros_telefono: string[];
  reviews: Array<{
    review_id: string;
    author_username: string;
    review_preset_1: number;
    review_preset_2?: number;
    review_type: string;
    date_created: string;
    location?: string;
  }>;
}

interface TokenInfo {
  user_id: string;
  username: string;
  person_id: string;
  expires_at: string;
}

export default function VerifyPage() {
  const [state, setState] = useState<VerifyState>('input');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Verificar token
  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setError('Please enter a valid token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired token');
        setLoading(false);
        return;
      }

      setTokenInfo(data.tokenInfo);
      setTimeRemaining(data.expiresInSeconds);
      setState('agreement');
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Aceptar acuerdo y ver perfil
  const handleAcceptAgreement = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/verify-token/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error loading profile');
        setLoading(false);
        return;
      }

      setProfileData(data.profile);
      setState('viewing');

      // Iniciar countdown
      startCountdown(data.expiresInSeconds);
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  const startCountdown = (seconds: number) => {
    setTimeRemaining(seconds);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Expirado - volver al inicio
          setState('input');
          setToken('');
          setProfileData(null);
          setTokenInfo(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Formatear tiempo restante
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Review presets (mismo que en la app)
  const reviewPresets: { [key: number]: string } = {
    1: "Showed aggressive or violent behavior",
    2: "Made me feel unsafe or uncomfortable",
    3: "Lied about their identity or intentions",
    4: "Pressured me for money or favors",
    5: "Sent inappropriate or unwanted content",
    6: "Ghosted or disappeared suddenly",
    7: "Was disrespectful or rude",
    8: "Tried to isolate me from others",
    9: "Had suspicious or secretive behavior",
    10: "Made threats or intimidating comments",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3D1A54] to-[#6A1B9A] flex flex-col">
      {/* App-like header - siempre visible */}
      <header className="bg-[#3D1A54] text-white py-4 px-4 flex items-center justify-center sticky top-0 z-50 safe-area-top">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-bold text-lg">SnapfaceID</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col px-4 py-6 overflow-auto">
        <div className="w-full max-w-lg mx-auto flex-grow flex flex-col">

          {/* Estado: Input de Token */}
          {state === 'input' && (
            <div className="bg-white rounded-3xl p-6 shadow-2xl flex-grow flex flex-col">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-[#6A1B9A]/10 rounded-full mb-4">
                  <svg className="w-10 h-10 text-[#6A1B9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Verify Access Token
                </h1>
                <p className="text-gray-500 text-sm">
                  Enter the token from your SnapfaceID app
                </p>
              </div>

              <div className="flex-grow flex flex-col justify-center space-y-5">
                <div>
                  <label htmlFor="token" className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Access Token
                  </label>
                  <input
                    type="text"
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-4 py-5 text-center text-2xl font-mono tracking-[0.3em] border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#6A1B9A] focus:border-[#6A1B9A] uppercase bg-gray-50 transition-all"
                    maxLength={14}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 animate-shake">
                    <p className="text-red-600 text-center text-sm font-medium">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleVerifyToken}
                  disabled={loading || !token.trim()}
                  className="w-full bg-[#6A1B9A] hover:bg-[#8B4DAE] active:scale-[0.98] disabled:bg-gray-300 disabled:scale-100 text-white py-5 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#6A1B9A]/30"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify Token'
                  )}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Tokens are single-use and expire in 15 minutes.
                  Generate a new one from the app if needed.
                </p>
              </div>
            </div>
          )}

          {/* Estado: Acuerdo Legal */}
          {state === 'agreement' && tokenInfo && (
            <div className="bg-white rounded-3xl shadow-2xl flex-grow flex flex-col overflow-hidden">
              <div className="bg-yellow-50 p-4 border-b border-yellow-100">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold text-yellow-800">Legal Agreement Required</span>
                </div>
              </div>

              <div className="flex-grow overflow-auto p-5">
                <h2 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Terms of Access</h2>

                <div className="space-y-4 text-sm text-gray-600">
                  <p className="text-gray-700">
                    By tapping &quot;I Agree&quot; you acknowledge:
                  </p>

                  <div className="space-y-3">
                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-[#6A1B9A] font-bold text-lg">1</span>
                      <div>
                        <p className="font-semibold text-gray-800">Confidentiality</p>
                        <p className="text-xs text-gray-500">You will NOT share, screenshot, or distribute this information.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-[#6A1B9A] font-bold text-lg">2</span>
                      <div>
                        <p className="font-semibold text-gray-800">Legal Use Only</p>
                        <p className="text-xs text-gray-500">For personal safety only. No harassment, stalking, or illegal use.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-[#6A1B9A] font-bold text-lg">3</span>
                      <div>
                        <p className="font-semibold text-gray-800">Legal Liability</p>
                        <p className="text-xs text-gray-500">Violations may result in civil/criminal prosecution.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-[#6A1B9A] font-bold text-lg">4</span>
                      <div>
                        <p className="font-semibold text-gray-800">Activity Tracked</p>
                        <p className="text-xs text-gray-500">Access logged to: <span className="font-mono text-[#6A1B9A]">{tokenInfo.username}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="bg-yellow-100 rounded-xl p-3 mb-4">
                  <p className="text-yellow-800 text-center text-sm font-semibold">
                    Expires in {formatTime(timeRemaining)}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-600 text-center text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setState('input');
                      setToken('');
                      setTokenInfo(null);
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 active:scale-[0.98] text-gray-700 py-4 rounded-2xl font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptAgreement}
                    disabled={loading}
                    className="flex-1 bg-[#FF5722] hover:bg-[#E64A19] active:scale-[0.98] disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-[#FF5722]/30"
                  >
                    {loading ? 'Loading...' : 'I Agree'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Estado: Viendo Perfil */}
          {state === 'viewing' && profileData && tokenInfo && (
            <div className="flex-grow flex flex-col space-y-4 select-none" style={{ WebkitUserSelect: 'none' }}>
              {/* Countdown header sticky */}
              <div className="bg-red-600 text-white rounded-2xl p-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold">{formatTime(timeRemaining)}</span>
                </div>
                <span className="text-xs opacity-80 font-mono">@{tokenInfo.username}</span>
              </div>

              {/* Fotos */}
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#6A1B9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photos
                  <span className="text-xs bg-[#6A1B9A]/10 text-[#6A1B9A] px-2 py-0.5 rounded-full">{profileData.selfies?.length || 0}</span>
                </h2>
                {profileData.selfies && profileData.selfies.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {profileData.selfies.slice(-6).map((url, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img
                          src={url}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover rounded-xl"
                          onContextMenu={(e) => e.preventDefault()}
                          draggable={false}
                        />
                        {/* Watermark overlay on each photo */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-white/20 text-[8px] font-bold rotate-[-30deg]">
                            {tokenInfo.username}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm py-4 text-center">No photos available</p>
                )}
              </div>

              {/* Teléfonos */}
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#6A1B9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone Numbers
                  <span className="text-xs bg-[#6A1B9A]/10 text-[#6A1B9A] px-2 py-0.5 rounded-full">{profileData.numeros_telefono?.length || 0}</span>
                </h2>
                {profileData.numeros_telefono && profileData.numeros_telefono.length > 0 ? (
                  <div className="space-y-2">
                    {profileData.numeros_telefono.map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <span className="w-6 h-6 bg-[#6A1B9A] text-white rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        <span className="font-mono text-base flex-grow">{phone}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm py-4 text-center">No phone numbers</p>
                )}
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-2xl p-4 shadow-lg">
                <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#6A1B9A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Safety Reports
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{profileData.reviews?.length || 0}</span>
                </h2>
                {profileData.reviews && profileData.reviews.length > 0 ? (
                  <div className="space-y-3">
                    {profileData.reviews.map((review, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 text-sm">@{review.author_username}</span>
                          <span className="text-xs text-gray-400">{new Date(review.date_created).toLocaleDateString()}</span>
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold mb-2 ${
                          review.review_type === 'inperson'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {review.review_type === 'inperson' ? 'In-Person' : 'Remote'}
                        </span>
                        <p className="text-gray-700 text-sm">
                          • {reviewPresets[review.review_preset_1] || `Report #${review.review_preset_1}`}
                        </p>
                        {review.review_preset_2 && (
                          <p className="text-gray-700 text-sm">
                            • {reviewPresets[review.review_preset_2] || `Report #${review.review_preset_2}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm py-4 text-center">No reports</p>
                )}
              </div>

              {/* Footer warning */}
              <div className="bg-gray-900 text-white rounded-2xl p-4 text-center">
                <p className="text-xs font-medium">CONFIDENTIAL - Activity tracked to @{tokenInfo.username}</p>
                <p className="text-[10px] opacity-60 mt-1">Misuse may result in legal action</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CSS para mobile y protecciones */}
      <style jsx global>{`
        /* Safe area padding for notched phones */
        .safe-area-top {
          padding-top: env(safe-area-inset-top, 0px);
        }

        /* Prevent pull-to-refresh */
        body {
          overscroll-behavior-y: contain;
        }

        /* Disable text selection */
        .select-none {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }

        /* Disable image save on long press */
        img {
          -webkit-touch-callout: none;
          pointer-events: none;
        }

        /* Disable print */
        @media print {
          body * {
            display: none !important;
          }
          body::after {
            content: "Printing is disabled for security.";
            display: block;
            font-size: 24px;
            text-align: center;
            padding: 100px;
          }
        }

        /* Shake animation for errors */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        /* Hide scrollbar but allow scrolling */
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
