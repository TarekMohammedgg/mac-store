import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const upsert = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle,
        }),
      }),
      upsert,
    }),
  },
}));

vi.mock('@/lib/data-refresh', () => ({
  notifyDataRefresh: vi.fn(),
}));

describe('settingsRepository', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    upsert.mockReset();
    vi.resetModules();
  });

  it('get_returns_defaults_without_writing_when_row_missing', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const { settingsRepository } = await import('@/repositories/settings.repository');

    const settings = await settingsRepository.get();

    expect(settings.id).toBe('app');
    expect(settings.storeName.length).toBeGreaterThan(0);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('ensureSeeded_persists_defaults_only_when_missing', async () => {
    maybeSingle
      .mockResolvedValueOnce({ data: null, error: null }) // get()
      .mockResolvedValueOnce({ data: null, error: null }); // existence check
    upsert.mockResolvedValue({ error: null });
    const { settingsRepository } = await import('@/repositories/settings.repository');

    const seeded = await settingsRepository.ensureSeeded();

    expect(seeded.id).toBe('app');
    expect(upsert).toHaveBeenCalledTimes(1);

    maybeSingle.mockReset();
    maybeSingle
      .mockResolvedValueOnce({
        data: {
          id: 'app',
          store_name: seeded.storeName,
          store_description: seeded.storeDescription,
          contact_email: seeded.contactEmail,
          currency: seeded.currency,
          show_serial_number: seeded.showSerialNumber,
          default_admin_username: seeded.defaultAdminUsername,
          updated_at: seeded.updatedAt,
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { id: 'app' }, error: null });
    upsert.mockClear();

    const again = await settingsRepository.ensureSeeded();

    expect(again.id).toBe('app');
    expect(upsert).not.toHaveBeenCalled();
  });
});
