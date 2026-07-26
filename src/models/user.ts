export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  username: string;
  createdAt: string;
  expiresAt: string;
}
