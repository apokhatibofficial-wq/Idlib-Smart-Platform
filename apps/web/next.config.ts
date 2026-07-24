import type { NextConfig } from 'next';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  async rewrites() {
    return [
      // Same-origin proxy to the NestJS API — keeps auth cookies first-party
      // (no CORS, no SameSite=None) and lets Google OAuth redirects complete
      // on the browser's own origin. See apps/api README for the API-side half.
      { source: '/api/v1/:path*', destination: `${API_ORIGIN}/v1/:path*` },
      { source: '/uploads/:path*', destination: `${API_ORIGIN}/uploads/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self)' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
      {
        // Fonts/icons are content-addressed by Next's build pipeline — safe to cache hard.
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
