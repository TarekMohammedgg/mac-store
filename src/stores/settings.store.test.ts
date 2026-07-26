import { beforeEach, describe, expect, it } from 'vitest';

import { useSettingsStore } from '@/stores/settings.store';
import type { AppSettings } from '@/models/settings';

const sampleSettings = (storeName: string): AppSettings => ({
  id: 'app',
  storeName,
  storeDescription: 'desc',
  contactEmail: 'a@b.com',
  currency: 'EGP',
  showSerialNumber: false,
  defaultAdminUsername: 'admin',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('settings store brand name', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: null, hydrated: false });
  });

  it('setSettings_updates_storeName_used_by_brand_hook', () => {
    useSettingsStore.getState().setSettings(sampleSettings('متجر جديد'));
    expect(useSettingsStore.getState().settings?.storeName).toBe('متجر جديد');
  });

  it('falls_back_when_settings_not_hydrated', () => {
    expect(useSettingsStore.getState().settings?.storeName).toBeUndefined();
  });
});
