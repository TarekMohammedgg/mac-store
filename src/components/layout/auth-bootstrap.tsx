'use client';

import * as React from 'react';

import { rehydrateAuthStore } from '@/stores/auth.store';
import { useSettingsStore } from '@/stores/settings.store';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const hydrateSettings = useSettingsStore((state) => state.hydrate);

  React.useEffect(() => {
    void rehydrateAuthStore();
    void hydrateSettings();
  }, [hydrateSettings]);

  return <>{children}</>;
}
