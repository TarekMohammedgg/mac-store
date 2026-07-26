'use client';

import { create } from 'zustand';

import type { AppSettings } from '@/models/settings';

interface SettingsState {
  settings: AppSettings | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSettings: (settings: AppSettings) => void;
  updateSettings: (
    data: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>,
  ) => Promise<AppSettings>;
}

let hydratePromise: Promise<void> | null = null;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  hydrated: false,
  async hydrate() {
    if (get().hydrated) return;
    if (hydratePromise) return hydratePromise;

    hydratePromise = (async () => {
      try {
        const { settingsService } = await import('@/services/settings.service');
        await settingsService.ensureSeeded();
        const settings = await settingsService.get();
        set({ settings, hydrated: true });
      } catch (error) {
        console.error('Settings hydrate failed', error);
        set({ hydrated: true });
      } finally {
        hydratePromise = null;
      }
    })();

    return hydratePromise;
  },
  setSettings(settings) {
    set({ settings, hydrated: true });
  },
  async updateSettings(data) {
    const { settingsService } = await import('@/services/settings.service');
    const settings = await settingsService.update(data);
    set({ settings, hydrated: true });
    return settings;
  },
}));

export function useStoreBrandName(fallback: string): string {
  return useSettingsStore((state) => state.settings?.storeName) ?? fallback;
}
