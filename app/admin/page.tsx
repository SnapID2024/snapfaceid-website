'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGO_URL = 'https://d64gsuwffb70l.cloudfront.net/6834a8f25630f332851529fb_1765418801539_cd77434c.png';

type LoginStep = 'credentials' | '2fa';

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [phoneHint, setPhoneHint] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Manejar envío de credenciales
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/2fa/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPhoneHint(data.phone_hint || '***-***-****');
        setStep('2fa');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar input del código de verificación
  const handleCodeInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Solo dígitos

    const newCode = [...verificationCode];
    newCode[index] = value.slice(-1); // Solo el último dígito
    setVerificationCode(newCode);

    // Mover al siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si todos los dígitos están completos, verificar automáticamente
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerifyCode(newCode.join(''));
    }
  };

  // Manejar tecla de retroceso
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verificar código 2FA
  const handleVerifyCode = async (code?: string) => {
    const codeToVerify = code || verificationCode.join('');

    if (codeToVerify.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/2fa/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: credentials.username,
          code: codeToVerify,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', credentials.username);
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Invalid verification code.');
        setVerificationCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');
    setVerificationCode(['', '', '', '', '', '']);

    try {
      const response = await fetch('/api/admin/2fa/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setError(''); // Clear any previous error
        alert('New verification code sent!');
        inputRefs.current[0]?.focus();
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Volver al paso de credenciales
  const handleBackToCredentials = () => {
    setStep('credentials');
    setVerificationCode(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D1A54] via-[#6A1B9A] to-[#3D1A54] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={LOGO_URL}
            alt="SnapfaceID"
            className="w-24 h-24 mx-auto mb-4 rounded-2xl shadow-lg"
          />
          <h1 className="text-2xl font-bold text-white mb-2">Guardian Monitor</h1>
          <p className="text-white/70">Admin Access Only</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {step === 'credentials' ? (
            <>
              {/* Step 1: Credentials */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <svg className="h-6 w-6 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-lg font-semibold text-gray-900">Secure Login</span>
              </div>

              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      type="text"
                      id="username"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent transition-all"
                      placeholder="Enter username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      id="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6A1B9A] focus:border-transparent transition-all"
                      placeholder="Enter password"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#6A1B9A] hover:bg-[#8B4DAE] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                      Continue
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Step 2: 2FA Verification */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#6A1B9A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-[#6A1B9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Code</h2>
                <p className="text-gray-600 text-sm">
                  We sent a 6-digit code to<br />
                  <span className="font-semibold text-[#6A1B9A]">{phoneHint}</span>
                </p>
              </div>

              {/* Code Input */}
              <div className="flex justify-center gap-2 mb-6">
                {verificationCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6A1B9A] focus:border-[#6A1B9A] transition-all"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 mb-4">
                  <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={() => handleVerifyCode()}
                disabled={isLoading || verificationCode.some(d => !d)}
                className="w-full bg-[#6A1B9A] hover:bg-[#8B4DAE] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 mb-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verify & Access
                  </>
                )}
              </button>

              {/* Actions */}
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={handleBackToCredentials}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  &larr; Back
                </button>
                <button
                  onClick={handleResendCode}
                  className="text-[#6A1B9A] hover:text-[#8B4DAE] font-medium transition-colors"
                  disabled={isLoading}
                >
                  Resend Code
                </button>
              </div>
            </>
          )}

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Protected by Two-Factor Authentication</span>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-white/70 hover:text-white transition-colors text-sm">
            &larr; Back to SnapfaceID
          </Link>
        </div>
      </div>
    </div>
  );
}
