/** Maps raw fetch/Supabase/Postgrest failures to stable codes for UI copy. */
export type AppErrorCode = 'config' | 'network' | 'auth' | 'unknown';

const NETWORK_RE =
  /failed to fetch|networkerror|load failed|network request failed|econnrefused|econnreset|enotfound|etimedout|err_network|err_connection|fetch failed|aborted|timeout/i;

const CONFIG_RE =
  /missing next_public_supabase|missing supabase env|invalid supabase url|supabase url is required/i;

const AUTH_RE =
  /invalid login credentials|email not confirmed|user already registered|invalid jwt|session|password|not authenticated|profile not found|reserved/i;

function readMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return '';
}

function readStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const status = (error as { status?: unknown; statusCode?: unknown }).status
    ?? (error as { statusCode?: unknown }).statusCode;
  return typeof status === 'number' ? status : undefined;
}

export function classifyError(error: unknown): AppErrorCode {
  const message = readMessage(error);
  const status = readStatus(error);

  if (CONFIG_RE.test(message)) return 'config';
  if (status === 0 || NETWORK_RE.test(message)) return 'network';
  if (
    status === 401 ||
    status === 403 ||
    AUTH_RE.test(message) ||
    (error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AuthApiError')
  ) {
    return 'auth';
  }
  return 'unknown';
}

/** Prefer the original message when it is already useful; otherwise a clear fallback. */
export function toUserFacingError(error: unknown, fallback = 'Something went wrong'): Error {
  const message = readMessage(error).trim();
  const code = classifyError(error);

  if (code === 'config') {
    return new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel → Project Settings → Environment Variables (copy from Supabase Dashboard → Connect).',
    );
  }

  if (code === 'network') {
    return new Error(
      'Cannot reach Supabase. Check your internet connection, that the project is not paused, and that NEXT_PUBLIC_SUPABASE_URL is correct.',
    );
  }

  if (message) return new Error(message);
  return new Error(fallback);
}

export function throwUserFacingError(error: unknown, fallback?: string): never {
  throw toUserFacingError(error, fallback);
}
