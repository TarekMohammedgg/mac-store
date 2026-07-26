'use client';

import * as React from 'react';

import { useAuthStore } from '@/stores/auth.store';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const initialized = useAuthStore((state) => state.initialized);

  React.useEffect(() => {
    if (!initialized) {
      void initialize();
    }
  }, [initialize, initialized]);

  return <>{children}</>;
}
