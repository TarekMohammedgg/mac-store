'use client';

import { create } from 'zustand';

import { toUserFacingError } from '@/lib/errors';
import type { AuthSession } from '@/models/user';

interface AuthState {
  session: AuthSession | null;
  /** True after first client bootstrap finishes. */
  hydrated: boolean;
  /** True after Supabase session is loaded. */
  initialized: boolean;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

let initializePromise: Promise<void> | null = null;
let authListenerAttached = false;

export const useAuthStore = create<AuthState>()((set, get) => ({
  session: null,
  hydrated: false,
  initialized: false,
  loading: false,
  error: null,
  async initialize() {
    if (get().initialized) return;
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      try {
        const session = await Promise.race([
          (async () => {
            const { authService } = await import('@/services/auth.service');
            const next = await authService.getCurrentSession();
            if (!authListenerAttached) {
              authListenerAttached = true;
              authService.onAuthChange((value) => {
                set({ session: value });
              });
            }
            return next;
          })(),
          new Promise<null>((resolve) => {
            window.setTimeout(() => resolve(null), 8_000);
          }),
        ]);
        if (get().initialized) return;
        set({ session, initialized: true, hydrated: true });
      } catch (error) {
        set({ initialized: true, hydrated: true, session: null });
        console.error('Auth initialize failed', error);
      } finally {
        initializePromise = null;
      }
    })();

    return initializePromise;
  },
  async login(email, password) {
    set({ loading: true, error: null });
    try {
      const { authService } = await import('@/services/auth.service');
      const session = await authService.login(email, password);
      set({ session, initialized: true, hydrated: true, loading: false });
    } catch (error) {
      const facing = toUserFacingError(error, 'Login failed');
      set({ loading: false, error: facing.message });
      throw facing;
    }
  },
  async signUp(email, password) {
    set({ loading: true, error: null });
    try {
      const { authService } = await import('@/services/auth.service');
      const session = await authService.signUp(email, password);
      set({ session, initialized: true, hydrated: true, loading: false });
    } catch (error) {
      const facing = toUserFacingError(error, 'Sign up failed');
      set({ loading: false, error: facing.message });
      throw facing;
    }
  },
  async logout() {
    const { authService } = await import('@/services/auth.service');
    await authService.logout();
    set({ session: null, loading: false });
  },
  async refresh() {
    const { authService } = await import('@/services/auth.service');
    const session = await authService.getCurrentSession();
    set({ session });
  },
}));

/** Call once on the client to unlock gated UI and restore the Supabase session. */
export async function rehydrateAuthStore(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (useAuthStore.getState().initialized) return;
  initializePromise = null;
  useAuthStore.setState({ hydrated: true });
  await useAuthStore.getState().initialize();
}
