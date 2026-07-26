'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AuthSession } from '@/models/user';

interface AuthState {
  session: AuthSession | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const noopStorage = {
  getItem: () => null as string | null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

function createStorage() {
  if (typeof window === 'undefined') return noopStorage;
  return window.sessionStorage;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      initialized: false,
      loading: false,
      error: null,
      async initialize() {
        try {
          const { authService } = await import('@/services/auth.service');
          await authService.ensureAdminSeeded();
          const session = await authService.getCurrentSession();
          set({ session, initialized: true });
        } catch (error) {
          set({ initialized: true, session: null });
          console.error('Auth initialize failed', error);
        }
      },
      async login(username, password) {
        set({ loading: true, error: null });
        try {
          const { authService } = await import('@/services/auth.service');
          const session = await authService.login(username, password);
          set({ session, loading: false, initialized: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ loading: false, error: message });
          throw error;
        }
      },
      async logout() {
        const { authService } = await import('@/services/auth.service');
        await authService.logout();
        set({ session: null });
      },
      async refresh() {
        const { authService } = await import('@/services/auth.service');
        const session = await authService.getCurrentSession();
        set({ session });
      },
    }),
    {
      name: 'macstore-auth',
      storage: createJSONStorage(() => createStorage()),
      partialize: (state) => ({ session: state.session }),
    },
  ),
);
