'use client';

import { APP_NAME, APP_DESCRIPTION, DEFAULT_CURRENCY } from '@/config/app.config';
import { getDb } from '@/lib/db';
import { toIsoString } from '@/lib/utils';
import type { AppSettings } from '@/models/settings';

import type { SettingsRepository } from './settings-repository.types';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  storeName: APP_NAME,
  storeDescription: APP_DESCRIPTION,
  contactEmail: 'contact@macstore.local',
  currency: DEFAULT_CURRENCY,
  showSerialNumber: false,
  defaultAdminUsername: process.env.NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME ?? 'admin',
  updatedAt: toIsoString(new Date()),
};

class DexieSettingsRepository implements SettingsRepository {
  async get(): Promise<AppSettings> {
    const db = getDb();
    const existing = await db.settings.get('app');
    if (existing) return existing;
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }

  async update(data: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>): Promise<AppSettings> {
    const db = getDb();
    const current = await this.get();
    const next: AppSettings = {
      ...current,
      ...data,
      id: 'app',
      updatedAt: toIsoString(new Date()),
    };
    await db.settings.put(next);
    return next;
  }

  async reset(): Promise<AppSettings> {
    const db = getDb();
    const next: AppSettings = { ...DEFAULT_SETTINGS, updatedAt: toIsoString(new Date()) };
    await db.settings.put(next);
    return next;
  }
}

export const settingsRepository: SettingsRepository = new DexieSettingsRepository();
