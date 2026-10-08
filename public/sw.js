const CACHE_PREFIX = 'af-bookstore-';
const CACHE_NAME = `${CACHE_PREFIX}offline-v2`;
const OFFLINE_URL = '/offline.html';
const APP_ASSETS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/images/favicon.svg',
  '/images/icon-192.png',
  '/images/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) return;

  if (APP_ASSETS.includes(requestUrl.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => cache.match(request, { ignoreSearch: true }))
        .then((cached) => cached || fetch(request))
    );
    return;
  }

  if (request.mode !== 'navigate') return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      const offlinePage = await cache.match(OFFLINE_URL);
      return offlinePage || Response.error();
    })
  );
});
