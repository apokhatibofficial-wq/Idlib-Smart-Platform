'use client';

import { useEffect } from 'react';

/**
 * Registers the hand-written service worker (public/sw.js — see that file for the
 * offline caching, push notification, and background-sync implementation). Runs
 * as a regular external script via useEffect rather than an inline <script> tag,
 * so it works cleanly under the app's strict nonce-based CSP.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err: unknown) => {
        console.error('Service worker registration failed:', err);
      });
    };

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
