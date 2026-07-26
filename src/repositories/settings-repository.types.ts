import type { AppSettings } from '@/models/settings';

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  /** Persist defaults when no settings row exists. Do not call from liveQuery. */
  ensureSeeded(): Promise<AppSettings>;
  update(data: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>): Promise<AppSettings>;
  reset(): Promise<AppSettings>;
}
