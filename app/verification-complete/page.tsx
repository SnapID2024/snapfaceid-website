'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function VerificationCompleteContent() {
  const searchParams = useSearchParams();
  const complaintId = searchParams.get('complaint_id') || '';
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    setRedirecting(true);
    const timer = setTimeout(() => {
      const appUrl = `snapfaceid://verification-complete?complaint_id=${complaintId}`;
      window.location.href = appUrl;
    }, 2000);

    return () => clearTimeout(timer);
  }, [complaintId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-[#6A1B9A] mb-4">
          Identity Verified!
        </h1>
        <p className="text-gray-600 mb-6">
          Your identity has been successfully verified. Your report will be reviewed within 7-10 business days.
        </p>
        {redirecting && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A1B9A] mx-auto mb-6"></div>
        )}
        <p className="text-sm text-gray-500 mb-4">
          Redirecting you back to the app...
        </p>
        <p className="text-sm text-gray-500">
          If you&apos;re not redirected automatically,{' '}
          <a
            href={`snapfaceid://verification-complete?complaint_id=${complaintId}`}
            className="text-[#6A1B9A] underline font-medium"
          >
            tap here to return to SnapfaceID
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerificationCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6A1B9A]"></div>
      </div>
    }>
      <VerificationCompleteContent />
    </Suspense>
  );
}
