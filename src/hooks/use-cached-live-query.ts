'use client';

import * as React from 'react';

import { subscribeDataRefresh } from '@/lib/data-refresh';

const cache = new Map<string, unknown>();

/**
 * Async query hook with in-memory cache. Refetches when deps change or when
 * notifyDataRefresh() is called after a mutation.
 */
export function useCachedLiveQuery<T>(
  key: string,
  querier: () => T | Promise<T>,
  deps: readonly unknown[] = [],
): T | undefined {
  const [snapshot, setSnapshot] = React.useState<T | undefined>(
    () => cache.get(key) as T | undefined,
  );
  const [tick, setTick] = React.useState(0);
  const querierRef = React.useRef(querier);
  querierRef.current = querier;

  React.useEffect(() => subscribeDataRefresh(() => setTick((value) => value + 1)), []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const value = await querierRef.current();
        if (cancelled) return;
        cache.set(key, value);
        setSnapshot(value);
      } catch (error) {
        console.error(`[useCachedLiveQuery] ${key}`, error);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick, ...deps]);

  return snapshot;
}
