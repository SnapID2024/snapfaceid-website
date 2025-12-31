'use client';

import { SafeModeProvider } from '../context/SafeModeContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeModeProvider>
      {children}
    </SafeModeProvider>
  );
}
