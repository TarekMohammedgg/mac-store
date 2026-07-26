import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const ENV_HINT =
  'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel → Project Settings → Environment Variables (from Supabase Dashboard → Connect).';

function readSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error(`Missing Supabase env. ${ENV_HINT}`);
  }

  try {
    // Validates protocol/host early so bad Connect paste fails with a clear message.
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('invalid protocol');
    }
  } catch {
    throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL. ${ENV_HINT}`);
  }

  return { url, publishableKey };
}

let client: SupabaseClient | null = null;

/** Lazy singleton so missing env fails on first use with a clear deploy message. */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const { url, publishableKey } = readSupabaseEnv();
  client = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  });
  return client;
}

/** Prefer `getSupabase()` in new code; kept for existing imports. */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getSupabase(), prop, receiver);
    return typeof value === 'function' ? value.bind(getSupabase()) : value;
  },
});
