// Placeholder — replaced with the full offline/push/background-sync implementation
// in a later pass (see project task list). Keeping registration wired up now so the
// rest of the app can be built and tested against a real (if minimal) worker.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
