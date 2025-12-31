'use client';

import React, { useState, useRef, useEffect } from 'react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

// Hash verification function
async function verifyAccess(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input + 'snapface_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

type Step = 'pin' | 'sending' | 'sms' | 'verifying';

const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onVerified }) => {
  const [step, setStep] = useState<Step>('pin');
  const [pinInput, setPinInput] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [phoneMask, setPhoneMask] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);
  const smsInputRef = useRef<HTMLInputElement>(null);

  // Expected PIN hash
  const expectedHash = '82b915ecf7b49518b00882a24d18c3d07eee5afc4d2b79f4b12345a285b6fd51';

  useEffect(() => {
    if (isOpen) {
      if (step === 'pin' && pinInputRef.current) {
        pinInputRef.current.focus();
      } else if (step === 'sms' && smsInputRef.current) {
        smsInputRef.current.focus();
      }
    }
    if (!isOpen) {
      // Reset state when modal closes
      setPinInput('');
      setSmsCode('');
      setSessionId('');
      setPhoneMask('');
      setError('');
      setStep('pin');
    }
  }, [isOpen, step]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length < 4) {
      setError('Mínimo 4 dígitos');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const hash = await verifyAccess(pinInput);
      if (hash === expectedHash) {
        // PIN correct, send SMS code
        setStep('sending');
        await sendSmsCode();
      } else {
        setError('Código incorrecto');
        setPinInput('');
      }
    } catch {
      setError('Error de verificación');
    }

    setIsProcessing(false);
  };

  const sendSmsCode = async () => {
    try {
      const response = await fetch('/api/display-mode/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send' }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setPhoneMask(data.phoneMask);
        setStep('sms');
      } else {
        setError('Error enviando código SMS');
        setStep('pin');
      }
    } catch {
      setError('Error de conexión');
      setStep('pin');
    }
  };

  const handleSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (smsCode.length !== 6) {
      setError('Ingresa el código de 6 dígitos');
      return;
    }

    setIsProcessing(true);
    setStep('verifying');
    setError('');

    try {
      const response = await fetch('/api/display-mode/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          sessionId,
          code: smsCode,
        }),
      });

      const data = await response.json();

      if (data.verified) {
        // Both PIN and SMS verified
        onVerified();
        onClose();
      } else {
        setError(data.error || 'Código incorrecto');
        setSmsCode('');
        setStep('sms');
      }
    } catch {
      setError('Error de verificación');
      setStep('sms');
    }

    setIsProcessing(false);
  };

  const handleResendCode = async () => {
    setError('');
    setStep('sending');
    await sendSmsCode();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <div
        className="bg-gray-900 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step 1: PIN Input */}
        {step === 'pin' && (
          <>
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm">Verificación requerida</p>
              <p className="text-gray-500 text-xs mt-1">Paso 1 de 2</p>
            </div>

            <form onSubmit={handlePinSubmit}>
              <input
                ref={pinInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                maxLength={8}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:border-gray-500"
                autoComplete="off"
              />

              {error && (
                <p className="text-red-400 text-sm text-center mt-2">{error}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || pinInput.length < 4}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50"
                >
                  {isProcessing ? '...' : 'Continuar'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step: Sending SMS */}
        {step === 'sending' && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm">Enviando código SMS...</p>
          </div>
        )}

        {/* Step 2: SMS Code Input */}
        {step === 'sms' && (
          <>
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm">Verificación SMS</p>
              <p className="text-gray-500 text-xs mt-1">Paso 2 de 2</p>
              <p className="text-gray-500 text-xs mt-2">
                Código enviado a {phoneMask}
              </p>
            </div>

            <form onSubmit={handleSmsSubmit}>
              <input
                ref={smsInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-gray-500"
                autoComplete="off"
              />

              {error && (
                <p className="text-red-400 text-sm text-center mt-2">{error}</p>
              )}

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || smsCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Verificar
                </button>
              </div>

              <button
                type="button"
                onClick={handleResendCode}
                className="w-full mt-3 text-gray-500 text-xs hover:text-gray-400"
              >
                Reenviar código
              </button>
            </form>
          </>
        )}

        {/* Step: Verifying SMS */}
        {step === 'verifying' && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-gray-600 border-t-white rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm">Verificando código...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PinModal;
