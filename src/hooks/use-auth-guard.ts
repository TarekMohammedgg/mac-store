'use client';

import { useEffect, useState } from 'react';

import { useAuthStore } from '@/stores/auth.store';

export function useAuthGuard() {
  const { session, initialized, initialize } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!initialized) {
      initialize();
    } else {
      setChecking(false);
    }
  }, [initialized, initialize]);

  useEffect(() => {
    if (initialized) setChecking(false);
  }, [initialized]);

  return { session, isAuthenticated: Boolean(session), checking, initialized };
}
