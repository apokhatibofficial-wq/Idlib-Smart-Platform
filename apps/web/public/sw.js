// Idlib Smart Platform — service worker
// Hand-written (no Workbox/next-pwa) for full control over three things the
// brief calls out explicitly: offline shell caching, push notifications, and
// background sync for complaint submission.

const VERSION = 'v1';
const APP_SHELL_CACHE = `idlib-shell-${VERSION}`;
const RUNTIME_CACHE = `idlib-runtime-${VERSION}`;
const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = ['/', '/offline', '/manifest.webmanifest'];

// ---------------------------------------------------------------------------
// Install / activate
// ---------------------------------------------------------------------------

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== APP_SHELL_CACHE && k !== RUNTIME_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// ---------------------------------------------------------------------------
// Fetch — network-first for pages, cache-first for immutable static assets,
// and a deliberate pass-through (no interception at all) for API calls so
// data is never served stale from a shared HTTP cache.
// ---------------------------------------------------------------------------

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(req));
    return;
  }

  const cacheable =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname === '/manifest.webmanifest';

  if (cacheable) {
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirstNavigate(req) {
  try {
    const res = await fetch(req);
    const cache = await caches.open(RUNTIME_CACHE);
    void cache.put(req, res.clone());
    return res;
  } catch {
    const runtime = await caches.open(RUNTIME_CACHE);
    const cached = await runtime.match(req);
    if (cached) return cached;
    const shell = await caches.open(APP_SHELL_CACHE);
    const offline = await shell.match(OFFLINE_URL);
    return offline || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    void cache.put(req, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // Non-JSON payload — show a generic notification rather than dropping it.
  }

  const title = data.title || 'منصة إدلب الذكية';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag,
    dir: 'rtl',
    lang: 'ar',
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});

// ---------------------------------------------------------------------------
// Background sync — replays complaints queued while offline (see
// src/lib/offline-queue.ts). The CSRF cookie generally is not readable from a
// service worker in every browser, so this is a two-tier strategy: try a
// direct replay via the Cookie Store API where it exists (Chromium), and
// otherwise wake any open tab to flush the queue from page context, where
// cookies are always readable (src/components/pwa/offline-queue-flusher.tsx).
// ---------------------------------------------------------------------------

const DB_NAME = 'idlib-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-complaints';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE_NAME)) {
        req.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllQueued() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function removeQueued(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function replayWithCookieStore() {
  if (!('cookieStore' in self)) return false;
  const csrfCookie = await self.cookieStore.get('idlib_csrf');
  if (!csrfCookie) return false;

  const items = await getAllQueued();
  for (const item of items) {
    try {
      const res = await fetch('/api/v1/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfCookie.value },
        body: JSON.stringify(item.payload),
        credentials: 'same-origin',
      });
      if (res.ok) await removeQueued(item.id);
    } catch {
      return true; // Attempted — still offline. Stop; the next sync trigger will retry.
    }
  }
  return true;
}

async function notifyClientsToFlush() {
  const clientsArr = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientsArr) client.postMessage({ type: 'FLUSH_OFFLINE_QUEUE' });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-complaints') {
    event.waitUntil(
      replayWithCookieStore().then((handled) => {
        if (!handled) return notifyClientsToFlush();
      }),
    );
  }
});
