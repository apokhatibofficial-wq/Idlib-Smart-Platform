export const ACCESS_TOKEN_COOKIE = 'idlib_at';
export const REFRESH_TOKEN_COOKIE = 'idlib_rt';
export const CSRF_COOKIE = 'idlib_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export const EMAIL_QUEUE = 'email';
export const PUSH_QUEUE = 'push';

export const PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Safe HTTP methods that never mutate state — exempt from CSRF header checks. */
export const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
