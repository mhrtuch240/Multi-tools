const CACHE_NAME = 'multi-tools-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    // Note: Actual icon paths from the manifest should be added here.
    // For now, using the placeholders. If the user adds actual icons,
    // these paths might need to be updated or a more dynamic caching
    // strategy for icons would be beneficial.
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-192x192.png',
    '/icons/icon-maskable-512x512.png',

    /* External Assets Caching Notes:
       - Caching external resources like Google Fonts or CDN-hosted CSS (e.g., Font Awesome)
         can be complex due to CORS (Cross-Origin Resource Sharing) policies and opaque responses.
       - Opaque responses (type: 'opaque') for cross-origin requests hide the actual content
         and status code, making it difficult to verify if caching was successful or if the
         resource is valid. They can also take up significant cache space.
       - For production, consider:
         1. Self-hosting these assets (download fonts/CSS and serve them from your domain).
            This gives you full control over caching.
         2. Using more advanced caching strategies like "stale-while-revalidate" for these
            assets if self-hosting isn't an option, and being mindful of cache size.
         3. Relying on standard browser caching for these external assets, which often works well.
       - The current `new Request(url, { mode: 'cors' })` attempts to fetch these with CORS,
         which is better than the default `no-cors` for some scenarios but might still result
         in opaque responses if the server doesn't send appropriate CORS headers.
    */
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&family=Roboto:wght@300;400;500&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
    // Potentially, the font files themselves if their URLs are known and stable (and self-hosted):
    // '/fonts/montserrat-vXX-latin-regular.woff2',
    // '/fonts/roboto-vXX-latin-regular.woff2',
    // '/webfonts/fa-solid-900.woff2', (example path for Font Awesome webfonts)
];

// Install event: cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching core assets');
                // Use addAll which fetches and caches.
                // It's atomic: if one file fails, the whole operation fails.
                return cache.addAll(ASSETS_TO_CACHE.map(url => new Request(url, { mode: 'cors' })))
                    .catch(error => {
                        console.error('Service Worker: Failed to cache one or more assets during install:', error);
                        // Optionally, decide if this is a critical failure.
                        // For external resources, it might be okay to fail gracefully.
                    });
            })
            .then(() => self.skipWaiting()) // Activate the new SW immediately
            .catch(error => {
                console.error('Service Worker: Cache open/addAll failed during install:', error);
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of all open clients
    );
});

// Fetch event: serve assets from cache, falling back to network
self.addEventListener('fetch', (event) => {
    // For navigation requests, use a network-first strategy to ensure fresh HTML,
    // but fall back to cache if offline.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // If response is valid, cache it and return it
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Network failed, try to serve from cache
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            return cachedResponse || caches.match('/index.html'); // Fallback to home if specific page not cached
                        });
                })
        );
        return;
    }

    // For other requests (CSS, JS, images), use a cache-first strategy.
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // console.log('Service Worker: Serving from cache:', event.request.url);
                    return cachedResponse;
                }
                // console.log('Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                    }
                    return networkResponse;
                }).catch(error => {
                    console.error('Service Worker: Fetch failed for:', event.request.url, error);
                    // Optionally, return a fallback response for specific asset types, e.g., an offline image.
                });
            })
    );
});
