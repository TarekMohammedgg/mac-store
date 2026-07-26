import { toUserFacingError } from '@/lib/errors';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, UserProfile, UserRole } from '@/models/user';

function rethrow(error: unknown, fallback?: string): never {
  throw toUserFacingError(error, fallback);
}

const ADMIN_ALIAS = (process.env.NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME ?? 'admin').toLowerCase();
const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL ?? 'admin@macstore.local'
).toLowerCase();

type ProfileRow = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toAuthSession(profile: UserProfile): AuthSession {
  const local = profile.email.split('@')[0] || profile.email;
  return {
    userId: profile.id,
    email: profile.email,
    role: profile.role,
    username: profile.role === 'admin' ? ADMIN_ALIAS : local,
  };
}

/** Accepts full email, or the admin shorthand "admin". */
export function resolveLoginEmail(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return trimmed;
  if (trimmed === ADMIN_ALIAS || trimmed === 'admin') return ADMIN_EMAIL;
  return trimmed;
}

class AuthService {
  async fetchProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) rethrow(error);
    if (!data) return null;
    return mapProfile(data as ProfileRow);
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) rethrow(error);
      const user = data.session?.user;
      if (!user) return null;

      const profile = await this.fetchProfile(user.id);
      if (!profile) {
        // Profile trigger may lag briefly after signup — build a safe fallback.
        return {
          userId: user.id,
          email: user.email ?? '',
          role: 'user',
          username: (user.email ?? 'user').split('@')[0],
        };
      }
      return toAuthSession(profile);
    } catch (error) {
      rethrow(error);
    }
  }

  async login(emailOrAlias: string, password: string): Promise<AuthSession> {
    try {
      const email = resolveLoginEmail(emailOrAlias);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) rethrow(error, 'Login failed');
      if (!data.user) throw new Error('Login failed');

      const profile = await this.fetchProfile(data.user.id);
      if (!profile) throw new Error('Profile not found');
      return toAuthSession(profile);
    } catch (error) {
      rethrow(error, 'Login failed');
    }
  }

  async signUp(email: string, password: string): Promise<AuthSession> {
    try {
      const normalized = email.trim().toLowerCase();
      if (normalized === ADMIN_EMAIL || normalized === ADMIN_ALIAS) {
        throw new Error('This account is reserved');
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
      });
      if (error) rethrow(error, 'Sign up failed');
      if (!data.user) throw new Error('Sign up failed');

      // If email confirmation is required, there may be no session yet.
      if (!data.session) {
        throw new Error('Check your email to confirm your account, then sign in.');
      }

      const profile = await this.fetchProfile(data.user.id);
      if (!profile) {
        return {
          userId: data.user.id,
          email: data.user.email ?? normalized,
          role: 'user',
          username: normalized.split('@')[0],
        };
      }
      return toAuthSession(profile);
    } catch (error) {
      rethrow(error, 'Sign up failed');
    }
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) rethrow(error);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const session = await this.getCurrentSession();
      if (!session) throw new Error('Not authenticated');

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: session.email,
        password: currentPassword,
      });
      if (verifyError) throw new Error('Current password is incorrect');

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) rethrow(error, 'Password update failed');
    } catch (error) {
      rethrow(error, 'Password update failed');
    }
  }

  onAuthChange(callback: (session: AuthSession | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      void (async () => {
        if (!supabaseSession?.user) {
          callback(null);
          return;
        }
        try {
          const profile = await this.fetchProfile(supabaseSession.user.id);
          if (!profile) {
            callback({
              userId: supabaseSession.user.id,
              email: supabaseSession.user.email ?? '',
              role: 'user',
              username: (supabaseSession.user.email ?? 'user').split('@')[0],
            });
            return;
          }
          callback(toAuthSession(profile));
        } catch {
          callback(null);
        }
      })();
    });
    return () => data.subscription.unsubscribe();
  }
}

export const authService = new AuthService();
