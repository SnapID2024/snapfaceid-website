'use client';

import { useState, useEffect } from 'react';

type VerifyState = 'input' | 'agreement' | 'viewing';

interface ReviewData {
  review_id: string;
  author_username: string;
  author_avatar_url?: string;
  author_preset_avatar_id?: number;
  review_preset_1: number;
  review_preset_2?: number;
  review_type: string;
  date_created: string;
  location?: string;
}

interface ProfileData {
  person_id: string;
  selfies: string[];
  numeros_telefono: string[];
  reviews: ReviewData[];
}

interface TokenInfo {
  user_id: string;
  username: string;
  person_id: string;
  expires_at: string;
}

// Preset avatars mapping
const presetAvatars: { [key: number]: string } = {
  1: '/avatars/1.png',
  2: '/avatars/2.png',
  3: '/avatars/3.png',
  4: '/avatars/4.png',
  5: '/avatars/5.png',
  6: '/avatars/6.png',
  7: '/avatars/7.png',
  8: '/avatars/8.png',
  9: '/avatars/9.png',
  10: '/avatars/10.png',
  11: '/avatars/11.png',
  12: '/avatars/12.png',
  13: '/avatars/13.png',
  14: '/avatars/14.png',
  15: '/avatars/15.png',
  16: '/avatars/16.png',
  17: '/avatars/17.png',
  18: '/avatars/18.png',
  19: '/avatars/19.png',
  20: '/avatars/20.png',
  21: '/avatars/21.png',
  22: '/avatars/22.png',
  23: '/avatars/23.png',
  24: '/avatars/24.png',
  25: '/avatars/25.png',
  26: '/avatars/26.png',
  27: '/avatars/27.png',
};

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

  // Formatear número de teléfono parcialmente oculto: +1786XXXXXX -> 786-XXX-0937
  const formatPhonePartial = (phone: string) => {
    // Limpiar el número
    const cleaned = phone.replace(/\D/g, '');

    // Si tiene código de país (+1), quitarlo
    const national = cleaned.length > 10 ? cleaned.slice(-10) : cleaned;

    if (national.length === 10) {
      const area = national.slice(0, 3);
      const last4 = national.slice(-4);
      return `${area}-XXX-${last4}`;
    }

    // Fallback: mostrar primeros 3 y últimos 4
    if (phone.length >= 7) {
      return `${phone.slice(0, 4)}...${phone.slice(-4)}`;
    }

    return phone;
  };

  // Formatear fecha con día y hora
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    return `${dayName}, ${monthName} ${dayNum}, ${year} at ${hour12}:${minutes} ${ampm}`;
  };

  // Obtener avatar URL
  const getAvatarUrl = (review: ReviewData) => {
    if (review.author_avatar_url) {
      return review.author_avatar_url;
    }
    if (review.author_preset_avatar_id && presetAvatars[review.author_preset_avatar_id]) {
      return presetAvatars[review.author_preset_avatar_id];
    }
    return presetAvatars[1]; // Default avatar
  };

  // Review presets
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

  // Detectar screenshot (limitado pero puede disuadir)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && state === 'viewing') {
        // Usuario cambió de pestaña o minimizó - posible screenshot
        console.log('Visibility changed while viewing');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
      {/* Header minimalista sin nombre de app */}
      <header className="bg-[#1a1a2e]/80 backdrop-blur-sm text-white py-3 px-4 flex items-center justify-center sticky top-0 z-50 safe-area-top border-b border-white/10">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-semibold text-sm tracking-wide">Secure Verification Portal</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col px-4 py-6 overflow-auto">
        <div className="w-full max-w-lg mx-auto flex-grow flex flex-col">

          {/* Estado: Input de Token */}
          {state === 'input' && (
            <div className="bg-white/95 backdrop-blur rounded-3xl p-6 shadow-2xl flex-grow flex flex-col">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F59E0B]/10 rounded-full mb-4">
                  <svg className="w-8 h-8 text-[#F59E0B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  Enter Access Token
                </h1>
                <p className="text-gray-500 text-sm">
                  Paste the token from your app
                </p>
              </div>

              <div className="flex-grow flex flex-col justify-center space-y-5">
                <div>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    className="w-full px-4 py-5 text-center text-2xl font-mono tracking-[0.3em] border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] uppercase bg-gray-50 transition-all"
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
                  className="w-full bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] disabled:bg-gray-300 disabled:scale-100 text-white py-5 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-[#F59E0B]/30"
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
                    'Verify'
                  )}
                </button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Tokens expire in 15 minutes and can only be used once.
                </p>
              </div>
            </div>
          )}

          {/* Estado: Acuerdo Legal */}
          {state === 'agreement' && tokenInfo && (
            <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl flex-grow flex flex-col overflow-hidden">
              <div className="bg-red-500 p-3">
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="font-bold text-white text-sm">Legal Agreement Required</span>
                </div>
              </div>

              <div className="flex-grow overflow-auto p-5">
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="text-gray-700 font-medium">
                    By continuing you acknowledge:
                  </p>

                  <div className="space-y-2">
                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-red-500 font-bold">•</span>
                      <p className="text-xs text-gray-600">You will NOT share, screenshot, or distribute this information.</p>
                    </div>

                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-red-500 font-bold">•</span>
                      <p className="text-xs text-gray-600">For personal safety verification only. No harassment or illegal use.</p>
                    </div>

                    <div className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                      <span className="text-red-500 font-bold">•</span>
                      <p className="text-xs text-gray-600">Violations may result in legal prosecution.</p>
                    </div>

                    <div className="flex gap-3 bg-yellow-50 p-3 rounded-xl border border-yellow-200">
                      <span className="text-yellow-600 font-bold">!</span>
                      <p className="text-xs text-yellow-800">All activity is logged and tracked.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="bg-red-100 rounded-xl p-3 mb-4">
                  <p className="text-red-800 text-center text-sm font-semibold">
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
                    className="flex-1 bg-[#F59E0B] hover:bg-[#D97706] active:scale-[0.98] disabled:bg-gray-300 text-white py-4 rounded-2xl font-bold transition-all shadow-lg"
                  >
                    {loading ? 'Loading...' : 'I Agree'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Estado: Viendo Perfil */}
          {state === 'viewing' && profileData && tokenInfo && (
            <div className="flex-grow flex flex-col space-y-4 select-none no-screenshot" style={{ WebkitUserSelect: 'none' }}>
              {/* Countdown header sticky */}
              <div className="bg-red-600 text-white rounded-2xl p-3 flex items-center justify-center sticky top-0 z-20 shadow-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
                </div>
              </div>

              {/* Fotos - Últimas 3, horizontal */}
              {profileData.selfies && profileData.selfies.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                  <div className="flex gap-2 justify-center overflow-x-auto">
                    {profileData.selfies.slice(-3).map((url, idx) => (
                      <div key={idx} className="relative flex-shrink-0 w-28 h-28">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover rounded-xl blur-on-screenshot"
                          onContextMenu={(e) => e.preventDefault()}
                          draggable={false}
                        />
                        {/* Watermark overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/5 rounded-xl">
                          <span className="text-white/30 text-[10px] font-bold rotate-[-30deg] select-none">
                            VERIFIED
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teléfonos - Últimos 3, formato parcial */}
              {profileData.numeros_telefono && profileData.numeros_telefono.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Associated Numbers</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profileData.numeros_telefono.slice(-3).map((phone, idx) => (
                      <div key={idx} className="bg-gray-100 rounded-xl px-4 py-2">
                        <span className="font-mono text-sm text-gray-700">{formatPhonePartial(phone)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews con avatar, location, time */}
              {profileData.reviews && profileData.reviews.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 shadow-lg">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Reports ({profileData.reviews.length})
                  </h3>
                  <div className="space-y-3">
                    {profileData.reviews.slice(-5).map((review, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl p-3">
                        {/* Header con avatar y info */}
                        <div className="flex items-start gap-3 mb-2">
                          <img
                            src={getAvatarUrl(review)}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = presetAvatars[1];
                            }}
                          />
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">@{review.author_username}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                review.review_type === 'inperson'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {review.review_type === 'inperson' ? 'IN-PERSON' : 'REMOTE'}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {formatDateTime(review.date_created)}
                            </div>
                            {review.location && (
                              <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {review.location}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contenido del reporte */}
                        <div className="ml-13 space-y-1">
                          <p className="text-gray-700 text-xs">
                            • {reviewPresets[review.review_preset_1] || `Report #${review.review_preset_1}`}
                          </p>
                          {review.review_preset_2 && (
                            <p className="text-gray-700 text-xs">
                              • {reviewPresets[review.review_preset_2] || `Report #${review.review_preset_2}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer warning */}
              <div className="bg-gray-900/90 backdrop-blur text-white rounded-2xl p-4 text-center">
                <p className="text-xs font-medium">CONFIDENTIAL - Activity logged</p>
                <p className="text-[10px] opacity-60 mt-1">Unauthorized distribution is prohibited</p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* CSS para mobile y protecciones anti-screenshot */}
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

        /* Anti-screenshot techniques */
        .no-screenshot {
          -webkit-filter: none;
        }

        /* Blur images on screenshot attempt (experimental) */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          .blur-on-screenshot {
            /* This creates a protective layer */
            filter: contrast(1.0001);
          }
        }

        /* Disable print completely */
        @media print {
          body * {
            display: none !important;
            visibility: hidden !important;
          }
          body::after {
            content: "Printing disabled";
            display: block !important;
            visibility: visible !important;
            font-size: 24px;
            text-align: center;
            padding: 100px;
          }
        }

        /* Disable screenshot on iOS Safari (experimental) */
        .no-screenshot img {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
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

        /* Prevent context menu on images */
        img {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -o-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
}
