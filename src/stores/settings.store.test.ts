import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSettingsStore, useSocialLinks } from '@/stores/settings.store';
import { createDefaultSocialLinks, type AppSettings } from '@/models/settings';

const sampleSettings = (storeName: string): AppSettings => ({
  id: 'app',
  storeName,
  storeDescription: 'desc',
  contactEmail: 'a@b.com',
  currency: 'EGP',
  showSerialNumber: false,
  defaultAdminUsername: 'admin',
  socialLinks: createDefaultSocialLinks(),
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

describe('useSocialLinks', () => {
  beforeEach(() => {
    useSettingsStore.setState({ settings: null, hydrated: false });
  });

  it('returns_stable_empty_array_when_settings_missing', () => {
    const { result, rerender } = renderHook(() => useSocialLinks());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    expect(result.current).toEqual([]);
  });

  it('returns_store_socialLinks_after_setSettings', () => {
    const settings = sampleSettings('Store');
    useSettingsStore.getState().setSettings(settings);
    const { result } = renderHook(() => useSocialLinks());
    expect(result.current).toBe(settings.socialLinks);
  });
});
