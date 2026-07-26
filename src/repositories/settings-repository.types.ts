import type { AppSettings } from '@/models/settings';

export interface SettingsRepository {
  get(): Promise<AppSettings>;
  update(data: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>): Promise<AppSettings>;
  reset(): Promise<AppSettings>;
}
