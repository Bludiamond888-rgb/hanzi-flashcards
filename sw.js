// Retirement service worker: clear all caches, unregister, then activate.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await self.clients.claim();
    for (const client of clients) {
      if ('navigate' in client) {
        try { client.navigate(client.url); } catch (_) {}
      }
    }
  })());
});
