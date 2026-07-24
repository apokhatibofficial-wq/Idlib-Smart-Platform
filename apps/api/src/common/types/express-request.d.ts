import type { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  username: string;
}

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- required shape for Express.User declaration merging
    interface User extends AuthenticatedUser {}
  }
}

export {};
