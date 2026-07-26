import type { AdminUser } from '@/models/user';

/** Legacy Dexie session shape — unused by Supabase auth. */
export interface LocalAuthSession {
  token: string;
  username: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuthRepository {
  getUser(): Promise<AdminUser | null>;
  createUser(data: {
    username: string;
    passwordHash: string;
    passwordSalt: string;
  }): Promise<AdminUser>;
  updatePassword(id: string, passwordHash: string, passwordSalt: string): Promise<AdminUser>;
  verifyCredentials(username: string, password: string): Promise<AdminUser | null>;
  createSession(token: string, user: AdminUser, ttlMs: number): Promise<LocalAuthSession>;
  getSession(token: string): Promise<LocalAuthSession | null>;
  deleteSession(token: string): Promise<void>;
}
