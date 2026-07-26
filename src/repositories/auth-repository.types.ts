import type { AdminUser, AuthSession } from '@/models/user';

export interface AuthRepository {
  getUser(): Promise<AdminUser | null>;
  createUser(data: { username: string; passwordHash: string; passwordSalt: string }): Promise<AdminUser>;
  updatePassword(id: string, passwordHash: string, passwordSalt: string): Promise<AdminUser>;
  verifyCredentials(username: string, password: string): Promise<AdminUser | null>;
  createSession(token: string, user: AdminUser, ttlMs: number): Promise<AuthSession>;
  getSession(token: string): Promise<AuthSession | null>;
  deleteSession(token: string): Promise<void>;
}
