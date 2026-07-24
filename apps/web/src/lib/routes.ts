import type { Role } from '@/types/api';

export function homePathForRole(role: Role): string {
  switch (role) {
    case 'MERCHANT':
      return '/merchant';
    case 'ADMIN':
      return '/admin';
    default:
      return '/home';
  }
}
