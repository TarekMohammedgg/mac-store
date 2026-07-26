import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

describe('useCachedLiveQuery', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns query result after resolve', async () => {
    const { useCachedLiveQuery } = await import('@/hooks/use-cached-live-query');
    const { result } = renderHook(() =>
      useCachedLiveQuery('products-list', async () => ['a'], []),
    );
    await waitFor(() => {
      expect(result.current).toEqual(['a']);
    });
  });

  it('keeps previous snapshot while a later query is pending', async () => {
    const { useCachedLiveQuery } = await import('@/hooks/use-cached-live-query');
    const { result, rerender } = renderHook(
      ({ key, value }: { key: string; value: number }) =>
        useCachedLiveQuery(key, async () => ({ total: value }), [value]),
      { initialProps: { key: 'dashboard-stats', value: 3 } },
    );

    await waitFor(() => {
      expect(result.current).toEqual({ total: 3 });
    });

    rerender({ key: 'dashboard-stats', value: 9 });
    expect(result.current).toEqual({ total: 3 });
    await waitFor(() => {
      expect(result.current).toEqual({ total: 9 });
    });
  });

  it('keeps snapshot when querier throws', async () => {
    const { useCachedLiveQuery } = await import('@/hooks/use-cached-live-query');
    let shouldFail = false;
    const { result, rerender } = renderHook(
      ({ tick }: { tick: number }) =>
        useCachedLiveQuery(
          'failing-query',
          async () => {
            if (shouldFail) throw new Error('boom');
            return { ok: true };
          },
          [tick],
        ),
      { initialProps: { tick: 0 } },
    );

    await waitFor(() => {
      expect(result.current).toEqual({ ok: true });
    });

    shouldFail = true;
    rerender({ tick: 1 });
    await waitFor(() => {
      expect(result.current).toEqual({ ok: true });
    });
  });
});
