/**
 * Canonical "safe" User projection — every query that returns a user to a client
 * MUST use this select (or a subset of it) so `passwordHash`, `googleId`, etc.
 * can never be accidentally serialized into an API response.
 */
export const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  phone: true,
  role: true,
  authProvider: true,
  emailVerifiedAt: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
