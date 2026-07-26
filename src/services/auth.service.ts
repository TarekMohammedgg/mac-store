import { repositories } from '@/repositories';
import { generateSalt, hashPassword } from '@/lib/hash';
import { generateId, toIsoString } from '@/lib/utils';
import type { AuthSession } from '@/models/user';

const SESSION_TOKEN_KEY = 'macstore_session_token';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

class AuthService {
  async ensureAdminSeeded(): Promise<void> {
    const existing = await repositories.authRepository.getUser();
    if (existing) return;
    const username = process.env.NEXT_PUBLIC_DEFAULT_ADMIN_USERNAME ?? 'admin';
    const password = process.env.NEXT_PUBLIC_DEFAULT_ADMIN_PASSWORD ?? 'admin1234';
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    await repositories.authRepository.createUser({ username, passwordHash, passwordSalt: salt });
  }

  async login(username: string, password: string): Promise<AuthSession> {
    await this.ensureAdminSeeded();
    const user = await repositories.authRepository.verifyCredentials(username, password);
    if (!user) throw new Error('Invalid credentials');
    const token = generateId('sess');
    const session = await repositories.authRepository.createSession(token, user, SESSION_TTL_MS);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_TOKEN_KEY, session.token);
    }
    return session;
  }

  async logout(): Promise<void> {
    if (typeof window === 'undefined') return;
    const token = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (token) {
      await repositories.authRepository.deleteSession(token);
      window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (typeof window === 'undefined') return null;
    const token = window.sessionStorage.getItem(SESSION_TOKEN_KEY);
    if (!token) return null;
    return repositories.authRepository.getSession(token);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = await repositories.authRepository.getUser();
    if (!user) throw new Error('Admin account not found');
    const session = await this.getCurrentSession();
    if (!session) throw new Error('Not authenticated');
    const isCurrent = await repositories.authRepository.verifyCredentials(
      session.username,
      currentPassword,
    );
    if (!isCurrent) throw new Error('Current password is incorrect');
    const salt = generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    await repositories.authRepository.updatePassword(user.id, passwordHash, salt);
  }

  isTokenValid(session: AuthSession | null): boolean {
    if (!session) return false;
    return new Date(session.expiresAt).getTime() > Date.now();
  }

  formatExpiry(session: AuthSession): string {
    return toIsoString(session.expiresAt);
  }
}

export const authService = new AuthService();
export { SESSION_TTL_MS };
