'use client';

import { APP_NAME, APP_DESCRIPTION, DEFAULT_CURRENCY } from '@/config/app.config';
import { notifyDataRefresh } from '@/lib/data-refresh';
import { mapSettings, toSettingsRow, type SettingsRow } from '@/lib/supabase/mappers';
import { supabase } from '@/lib/supabase/client';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { toIsoString } from '@/lib/utils';
import type { AppSettings } from '@/models/settings';

import type { SettingsRepository } from './settings-repository.types';

function createDefaultSettings(): AppSettings {
  return {
    id: 'app',
    storeName: APP_NAME,
    storeDescription: APP_DESCRIPTION,
    contactEmail: 'contact@macstore.local',
    currency: DEFAULT_CURRENCY,
    showSerialNumber: false,
    defaultAdminUsername: process.env.NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME ?? 'admin',
    updatedAt: toIsoString(new Date()),
  };
}

class SupabaseSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'app')
      .maybeSingle();
    throwIfSupabaseError(error);
    return data ? mapSettings(data as SettingsRow) : createDefaultSettings();
  }

  async ensureSeeded(): Promise<AppSettings> {
    const existing = await this.get();
    const { data } = await supabase.from('app_settings').select('id').eq('id', 'app').maybeSingle();
    if (data) return existing;
    const next = createDefaultSettings();
    const { error } = await supabase.from('app_settings').upsert(toSettingsRow(next));
    throwIfSupabaseError(error);
    notifyDataRefresh();
    return next;
  }

  async update(data: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>): Promise<AppSettings> {
    const current = await this.get();
    const next: AppSettings = {
      ...current,
      ...data,
      id: 'app',
      updatedAt: toIsoString(new Date()),
    };
    const { error } = await supabase.from('app_settings').upsert(toSettingsRow(next));
    throwIfSupabaseError(error);
    notifyDataRefresh();
    return next;
  }

  async reset(): Promise<AppSettings> {
    const next = createDefaultSettings();
    const { error } = await supabase.from('app_settings').upsert(toSettingsRow(next));
    throwIfSupabaseError(error);
    notifyDataRefresh();
    return next;
  }
}

export const settingsRepository: SettingsRepository = new SupabaseSettingsRepository();
