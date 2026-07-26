import { repositories } from '@/repositories';
import type { AppSettings } from '@/models/settings';

class SettingsService {
  get() {
    return repositories.settingsRepository.get();
  }

  ensureSeeded() {
    return repositories.settingsRepository.ensureSeeded();
  }

  update(data: Partial<Omit<AppSettings, 'id' | 'updatedAt'>>) {
    return repositories.settingsRepository.update(data);
  }

  reset() {
    return repositories.settingsRepository.reset();
  }
}

export const settingsService = new SettingsService();
