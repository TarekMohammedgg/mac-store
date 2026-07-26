'use client';

import { useEffect } from 'react';

import { rehydrateAuthStore, useAuthStore } from '@/stores/auth.store';

export function useAuthGuard() {
  const session = useAuthStore((state) => state.session);
  const initialized = useAuthStore((state) => state.initialized);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    void rehydrateAuthStore();
  }, []);

  return {
    session,
    isAuthenticated: Boolean(session),
    isAdmin: session?.role === 'admin',
    hydrated: hydrated && initialized,
    initialized,
  };
}
