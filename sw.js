
const CACHE_NAME = 'wireguard-config-cache-v4';
// App Shell: Core files needed for the app to run offline
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/constants.tsx',
  '/types.ts',
  '/manifest.json',
  '/icon.svg',
];

// Pre-cache App Shell on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(err => {
        console.error('App Shell caching failed:', err);
      })
  );
});

// Stale-while-revalidate strategy for all GET requests
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      
      const fetchPromise = fetch(event.request).catch(err => {
        // This catch handles network errors for the fetchPromise, 
        // preventing an unhandled rejection if the network fails.
        // It's important when the response is not in cache.
        console.error('Network fetch failed:', err);
        throw err;
      });

      // This is the "stale-while-revalidate" part.
      // We initiate the fetch request for a fresh version.
      // If it succeeds, we update the cache in the background.
      if (cachedResponse) {
          fetchPromise.then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
          }).catch(err => {
              // The background update failed. The user already has the cached version, so we can ignore this error.
              console.warn(`Background cache update for ${event.request.url} failed.`, err);
          });
      }

      // Return the cached response if available, otherwise wait for the network response.
      return cachedResponse || fetchPromise;
    })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});