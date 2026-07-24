import { NextRequest, NextResponse } from 'next/server';

const ACCESS_TOKEN_COOKIE = 'idlib_at';

const PROTECTED_PREFIXES = ['/home', '/complaints', '/market', '/chat', '/profile', '/merchant', '/admin'];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast, cookie-presence-only bounce for obviously-anonymous requests to protected
  // areas. This is a UX optimization, not the security boundary: every protected
  // layout also does a real server-side session check against the API (see
  // src/lib/server-auth.ts), and every API call is independently authorized by
  // the backend regardless of what the client renders.
  if (isProtectedPath(pathname) && !request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isProd = process.env.NODE_ENV === 'production';

  // The chat WebSocket connects directly to the API's public origin (Next.js
  // rewrites only proxy HTTP, not WS upgrades — see src/lib/use-chat-socket.ts),
  // so that origin needs an explicit connect-src allowance in both http(s) and
  // ws(s) form.
  const apiOrigin = process.env.NEXT_PUBLIC_API_ORIGIN ?? '';
  const apiWsOrigin = apiOrigin.replace(/^http/, 'ws');
  const connectSrc = ['\'self\'', apiOrigin, apiWsOrigin].filter(Boolean).join(' ');

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? '' : " 'unsafe-eval'"}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src ${connectSrc}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    isProd ? 'upgrade-insecure-requests' : '',
  ]
    .filter(Boolean)
    .join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
