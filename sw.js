const CACHE_NAME = 'ebook-reader-v1';
const CACHE_VERSION = 'v1';
const ASSETS_CACHE = 'ebook-assets-v1';
const SYNC_TAG = 'sync-ebooks';

// List of core files to cache
const CORE_FILES = [
  '/',
  '/index.html',
  '/book.html',
  '/toc.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache core files
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(CORE_FILES)),
      // Initialize assets cache
      caches.open(ASSETS_CACHE)
        .then(cache => {
          console.log('Assets cache initialized');
          return cache;
        })
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for content updates
self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncContent());
  }
});

// Function to check for content updates
async function checkForUpdates() {
  try {
    const response = await fetch('/version.json');
    const data = await response.json();
    const currentVersion = localStorage.getItem('contentVersion');
    
    if (currentVersion !== data.version) {
      // New version available, trigger sync
      self.registration.sync.register(SYNC_TAG);
    }
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

// Function to sync content
async function syncContent() {
  try {
    const cache = await caches.open(ASSETS_CACHE);
    const response = await fetch('/content-manifest.json');
    const manifest = await response.json();
    
    // Download and cache new or updated files
    for (const [url, hash] of Object.entries(manifest.files)) {
      const cachedResponse = await cache.match(url);
      const cachedHash = cachedResponse?.headers.get('content-hash');
      
      if (!cachedResponse || cachedHash !== hash) {
        const newResponse = await fetch(url);
        const newResponseClone = newResponse.clone();
        
        // Add content hash to headers
        const headers = new Headers(newResponse.headers);
        headers.set('content-hash', hash);
        
        const newResponseWithHash = new Response(await newResponse.blob(), {
          status: newResponse.status,
          statusText: newResponse.statusText,
          headers: headers
        });
        
        await cache.put(url, newResponseWithHash);
      }
    }
    
    // Update version in localStorage
    localStorage.setItem('contentVersion', manifest.version);
    
    // Notify clients of update
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'content-updated',
        version: manifest.version
      });
    });
  } catch (error) {
    console.error('Error syncing content:', error);
  }
}

// Fetch event with improved caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Handle asset requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if available
        if (response) {
          // Check if content is stale
          const contentHash = response.headers.get('content-hash');
          if (contentHash) {
            fetch(event.request)
              .then(newResponse => {
                const newHash = newResponse.headers.get('content-hash');
                if (newHash && newHash !== contentHash) {
                  // Content has changed, update cache
                  caches.open(ASSETS_CACHE)
                    .then(cache => cache.put(event.request, newResponse));
                }
              })
              .catch(() => {
                // Network error, continue with cached content
              });
          }
          return response;
        }

        // No cache hit, fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the response
            caches.open(ASSETS_CACHE)
              .then(cache => cache.put(event.request, responseToCache));

            return response;
          })
          .catch(() => {
            // If fetch fails, return offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Periodic sync check
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
}); 