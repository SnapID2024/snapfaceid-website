'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') || '';
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setRedirecting(true);
    const timer = setTimeout(() => {
      const appUrl = `snapfaceid://success?userId=${userId}`;
      window.location.href = appUrl;
    }, 1500);

    return () => clearTimeout(timer);
  }, [userId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Your subscription has been activated. Redirecting you back to the app...
        </p>
        {redirecting && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-6"></div>
        )}
        <p className="text-sm text-gray-500">
          If you&apos;re not redirected automatically,{' '}
          <a
            href={`snapfaceid://success?userId=${userId}`}
            className="text-[#6A1B9A] underline"
          >
            tap here to return to SnapfaceID
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
