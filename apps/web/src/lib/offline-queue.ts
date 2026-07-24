'use client';

// Keep these three constants byte-for-byte identical to the copies in
// public/sw.js — the page and the service worker must agree on the same
// IndexedDB database/store to hand off queued submissions between them.
export const OFFLINE_DB_NAME = 'idlib-offline';
export const OFFLINE_DB_VERSION = 1;
export const COMPLAINTS_STORE = 'pending-complaints';
const SYNC_TAG = 'sync-complaints';

interface QueuedComplaint {
  id: number;
  payload: unknown;
  queuedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(COMPLAINTS_STORE)) {
        req.result.createObjectStore(COMPLAINTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Persists a complaint payload for later replay once connectivity returns. */
export async function queueComplaintForSync(payload: unknown): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(COMPLAINTS_STORE, 'readwrite');
    tx.objectStore(COMPLAINTS_STORE).add({ payload, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      await (registration as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register(
        SYNC_TAG,
      );
    }
  }
}

export async function getQueuedComplaints(): Promise<QueuedComplaint[]> {
  const db = await openDb();
  const items = await new Promise<QueuedComplaint[]>((resolve, reject) => {
    const tx = db.transaction(COMPLAINTS_STORE, 'readonly');
    const req = tx.objectStore(COMPLAINTS_STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedComplaint[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

export async function removeQueuedComplaint(id: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(COMPLAINTS_STORE, 'readwrite');
    tx.objectStore(COMPLAINTS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
