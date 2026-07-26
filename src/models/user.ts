export type UserRole = 'admin' | 'user';

/** Legacy local admin row (Dexie). Auth now uses Supabase profiles. */
export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  /** Display label (email local-part for admin shorthand). */
  username: string;
}
