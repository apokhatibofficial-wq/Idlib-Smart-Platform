import { cookies, headers } from 'next/headers';
import type { CurrentUser } from '@/types/api';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:4000';

/**
 * Authoritative session check for Server Components. Forwards the browser's
 * cookies to the API directly (bypassing the client-facing rewrite, since a
 * server-to-server call has no browser to proxy through) so every protected
 * layout renders against a JWT the backend has actually verified — never a
 * client-decoded token.
 */
export async function getServerUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) return null;

  try {
    const res = await fetch(`${API_ORIGIN}/v1/users/me`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: CurrentUser };
    return json.data;
  } catch {
    return null;
  }
}

export async function getNonce(): Promise<string | undefined> {
  const h = await headers();
  return h.get('x-nonce') ?? undefined;
}
