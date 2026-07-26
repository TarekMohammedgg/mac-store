type Listener = () => void;

const listeners = new Set<Listener>();

/** Shared in-memory query cache used by useCachedLiveQuery. */
const queryCache = new Map<string, unknown>();

export function getCachedQuery<T>(key: string): T | undefined {
  return queryCache.get(key) as T | undefined;
}

export function setCachedQuery(key: string, value: unknown): void {
  queryCache.set(key, value);
}

export function clearQueryCache(): void {
  queryCache.clear();
}

/** Notify UI hooks to refetch after a successful Supabase mutation. */
export function notifyDataRefresh(): void {
  queryCache.clear();
  listeners.forEach((listener) => listener());
}

export function subscribeDataRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
