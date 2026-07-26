import { throwUserFacingError } from '@/lib/errors';

/** Throw a clear user-facing Error when a Supabase query/storage call fails. */
export function throwIfSupabaseError(
  error: { message?: string; code?: string; status?: number } | null | undefined,
): asserts error is null | undefined {
  if (error) throwUserFacingError(error);
}
