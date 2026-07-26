type Listener = () => void;

const listeners = new Set<Listener>();

/** Notify UI hooks to refetch after a successful Supabase mutation. */
export function notifyDataRefresh(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeDataRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
