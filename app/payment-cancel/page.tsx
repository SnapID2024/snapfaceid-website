'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || '';
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setRedirecting(true);
    const timer = setTimeout(() => {
      const appUrl = `snapfaceid://subscription-choice?userId=${userId}`;
      window.location.href = appUrl;
    }, 2000);

    return () => clearTimeout(timer);
  }, [userId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔙</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-4">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 mb-6">
          No worries! You can subscribe anytime. Redirecting you back to the app...
        </p>
        {redirecting && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-6"></div>
        )}
        <p className="text-sm text-gray-500">
          If you&apos;re not redirected automatically,{' '}
          <a
            href={`snapfaceid://subscription-choice?userId=${userId}`}
            className="text-[#6A1B9A] underline"
          >
            tap here to return to SnapfaceID
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
}
