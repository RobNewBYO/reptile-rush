// Bump CACHE when the shell changes in a way hashed assets can't cover.
const CACHE = 'reptile-rush-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest'])));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // Hashed build assets never change: cache-first. Everything else (page, levels): network-first
  // so updates reach the iPad, falling back to cache when offline.
  const immutable = url.pathname.startsWith('/assets/');
  e.respondWith(
    immutable
      ? caches.match(req).then((hit) => hit || fetchAndCache(req))
      : fetchAndCache(req).catch(() => caches.match(req).then((hit) => hit || caches.match('/'))),
  );
});

function fetchAndCache(req) {
  return fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  });
}
