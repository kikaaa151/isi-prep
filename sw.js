// Offline support for the installed app: network first (content updates show up at once), cache when offline.
// Bump CACHE when SHELL changes.
const CACHE = 'isi-prep-v1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'css/base.css', 'css/components.css', 'css/code.css', 'css/studio.css', 'css/reading.css',
  'js/boot.js', 'js/data.js', 'js/logic.js', 'js/store.js', 'js/ui.js', 'js/app.js',
  'js/views/dashboard.js', 'js/views/test.js', 'js/views/practice.js', 'js/views/theory.js',
  'js/views/codes.js', 'js/views/weeks.js', 'js/views/settings.js'
];
// On a slow mobile connection the cached copy is served after this delay.
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(respond(request));
});

function respond(request) {
  return caches.open(CACHE).then(function (cache) {
    const network = fetch(request, { cache: 'no-cache' }).then(function (response) {
      if (response.ok) cache.put(request, response.clone()).catch(function () {});
      return response;
    });
    return cache.match(request, { ignoreSearch: true }).then(function (cached) {
      if (!cached) return network;
      const timeout = new Promise(function (resolve) {
        setTimeout(function () { resolve(cached); }, NETWORK_TIMEOUT_MS);
      });
      return Promise.race([network.catch(function () { return cached; }), timeout]);
    });
  });
}
