const CACHE_NAME = 'morel-scout-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/esri-leaflet/3.0.12/esri-leaflet.min.js',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
];

// Install: cache app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API/tile requests, cache-first for shell assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Map tiles and NIFC API: network first, cache as backup
  if (url.hostname.includes('tile.') ||
      url.hostname.includes('arcgisonline.com') ||
      url.hostname.includes('basemaps.cartocdn.com') ||
      url.hostname.includes('services3.arcgis.com')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          // Cache successful tile/API responses
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Shell assets: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
