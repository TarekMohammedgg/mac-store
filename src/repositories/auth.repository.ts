'use client';

import { verifyPassword } from '@/lib/hash';
import { getDb } from '@/lib/db';
import { generateId, toIsoString } from '@/lib/utils';
import type { AdminUser, AuthSession } from '@/models/user';

import type { AuthRepository } from './auth-repository.types';

class DexieAuthRepository implements AuthRepository {
  async getUser(): Promise<AdminUser | null> {
    const db = getDb();
    const all = await db.users.toArray();
    return all[0] ?? null;
  }

  async createUser(data: {
    username: string;
    passwordHash: string;
    passwordSalt: string;
  }): Promise<AdminUser> {
    const db = getDb();
    const existing = await db.users.toArray();
    if (existing.length > 0) {
      throw new Error('An admin account already exists');
    }
    const now = toIsoString(new Date());
    const user: AdminUser = {
      id: generateId('usr'),
      username: data.username,
      passwordHash: data.passwordHash,
      passwordSalt: data.passwordSalt,
      createdAt: now,
      updatedAt: now,
    };
    await db.users.put(user);
    return user;
  }

  async updatePassword(id: string, passwordHash: string, passwordSalt: string): Promise<AdminUser> {
    const db = getDb();
    const user = await db.users.get(id);
    if (!user) throw new Error('Admin user not found');
    const next: AdminUser = {
      ...user,
      passwordHash,
      passwordSalt,
      updatedAt: toIsoString(new Date()),
    };
    await db.users.put(next);
    return next;
  }

  async verifyCredentials(username: string, password: string): Promise<AdminUser | null> {
    const user = await this.getUser();
    if (!user) return null;
    if (user.username !== username) return null;
    const valid = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    return valid ? user : null;
  }

  async createSession(token: string, user: AdminUser, ttlMs: number): Promise<AuthSession> {
    const db = getDb();
    const now = Date.now();
    const record = {
      token,
      username: user.username,
      createdAt: toIsoString(new Date(now)),
      expiresAt: toIsoString(new Date(now + ttlMs)),
    };
    await db.authSessions.put(record);
    return record;
  }

  async getSession(token: string): Promise<AuthSession | null> {
    const db = getDb();
    const record = await db.authSessions.get(token);
    if (!record) return null;
    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      await this.deleteSession(token);
      return null;
    }
    return record;
  }

  async deleteSession(token: string): Promise<void> {
    const db = getDb();
    await db.authSessions.delete(token);
  }
}

export const authRepository: AuthRepository = new DexieAuthRepository();
