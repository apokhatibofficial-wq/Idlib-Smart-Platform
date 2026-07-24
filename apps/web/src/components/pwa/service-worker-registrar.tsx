'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch((err: unknown) => {
        console.error('Service worker registration failed:', err);
      });
    };

    // `load` may already have fired by the time this effect runs (hydration
    // often completes after window load), in which case the listener below
    // would never fire — so register immediately in that case instead.
    if (document.readyState === 'complete') {
      register();
      return;
    }
    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
