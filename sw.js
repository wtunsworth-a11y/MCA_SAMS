// Service worker: the app shell is cached on install so the tool opens and
// works in the field with no connection. Survey data never travels through
// here — it lives in IndexedDB on the device.

const CACHE = 'managalas-survey-v1';

const SHELL = [
  '.',
  'index.html',
  'css/styles.css',
  'js/app.js',
  'js/locations.js',
  'js/storage.js',
  'js/photos.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for the shell: on site, a stale-but-working app beats a spinner.
// Network responses are folded back into the cache so an update lands on the
// next visit that does have signal.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((hit) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => hit);
      return hit || fetched;
    })
  );
});
