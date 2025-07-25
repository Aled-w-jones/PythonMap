// Service Worker for PythonMap - Enhanced Caching for GitHub Pages
const CACHE_NAME = 'pythonmap-v1';
const CACHE_VERSION = '1.0.0';

// Resources to cache immediately
const PRECACHE_RESOURCES = [
	'/',
	'/notepads',
	'/browser',
	'/data/search_index.json',
	// Add static assets
	'/favicon.svg'
];

// Resources that should be cached on first request
const RUNTIME_CACHE_PATTERNS = [
	/\/data\/scripts\/.+\.txt$/,
	/\/data\/readmes\/.+\.html$/,
	/\/_app\//,
	/\.js$/,
	/\.css$/
];

// Cache durations
const CACHE_STRATEGIES = {
	// Static files - cache for a long time
	static: {
		maxAge: 24 * 60 * 60 * 1000, // 24 hours
		patterns: [/\/_app\//, /\.js$/, /\.css$/]
	},
	// Data files - cache for shorter time
	data: {
		maxAge: 5 * 60 * 1000, // 5 minutes
		patterns: [/\/data\/scripts\//, /\/data\/readmes\//, /\/data\/search_index\.json$/]
	},
	// Pages - cache briefly
	pages: {
		maxAge: 2 * 60 * 1000, // 2 minutes
		patterns: [/^\/$/, /\/notepads/, /\/browser/]
	}
};

// Install event - precache essential resources
self.addEventListener('install', (event) => {
	console.log('[SW] Installing service worker');
	
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then((cache) => {
				console.log('[SW] Precaching resources');
				return cache.addAll(PRECACHE_RESOURCES.map(url => new Request(url, {cache: 'no-cache'})));
			})
			.then(() => {
				console.log('[SW] Skip waiting');
				return self.skipWaiting();
			})
			.catch((error) => {
				console.error('[SW] Precaching failed:', error);
			})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating service worker');
	
	event.waitUntil(
		caches.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((cacheName) => cacheName !== CACHE_NAME)
						.map((cacheName) => {
							console.log('[SW] Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						})
				);
			})
			.then(() => {
				console.log('[SW] Claiming clients');
				return self.clients.claim();
			})
	);
});

// Helper function to determine cache strategy for a request
function getCacheStrategy(url) {
	for (const [name, strategy] of Object.entries(CACHE_STRATEGIES)) {
		if (strategy.patterns.some(pattern => pattern.test(url))) {
			return { name, ...strategy };
		}
	}
	return { name: 'default', maxAge: 60 * 1000, patterns: [] }; // 1 minute default
}

// Helper function to check if cached response is still fresh
function isCacheFresh(cachedResponse, maxAge) {
	if (!cachedResponse) return false;
	
	const cachedDate = new Date(cachedResponse.headers.get('date') || cachedResponse.headers.get('sw-cached-at'));
	const now = new Date();
	
	return (now.getTime() - cachedDate.getTime()) < maxAge;
}

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);
	
	// Only handle GET requests
	if (request.method !== 'GET') {
		return;
	}
	
	// Skip cross-origin requests unless they're for our assets
	if (url.origin !== self.location.origin) {
		return;
	}
	
	const strategy = getCacheStrategy(url.pathname);
	
	event.respondWith(
		caches.open(CACHE_NAME)
			.then(async (cache) => {
				try {
					// Check cache first
					const cachedResponse = await cache.match(request);
					
					// If we have a fresh cached response, return it
					if (cachedResponse && isCacheFresh(cachedResponse, strategy.maxAge)) {
						console.log(`[SW] Cache hit (${strategy.name}):`, url.pathname);
						return cachedResponse;
					}
					
					// Fetch from network
					console.log(`[SW] Network fetch (${strategy.name}):`, url.pathname);
					const networkResponse = await fetch(request);
					
					// If successful, cache the response
					if (networkResponse.ok) {
						// Clone the response as we can only read it once
						const responseToCache = networkResponse.clone();
						
						// Add timestamp for cache freshness checking
						const headers = new Headers(responseToCache.headers);
						headers.set('sw-cached-at', new Date().toISOString());
						
						const cachedResponseWithTimestamp = new Response(responseToCache.body, {
							status: responseToCache.status,
							statusText: responseToCache.statusText,
							headers
						});
						
						// Cache the response
						cache.put(request, cachedResponseWithTimestamp);
						console.log(`[SW] Cached (${strategy.name}):`, url.pathname);
					}
					
					return networkResponse;
					
				} catch (error) {
					console.error('[SW] Fetch failed:', error);
					
					// If network fails, try to return stale cache
					const cachedResponse = await cache.match(request);
					if (cachedResponse) {
						console.log('[SW] Returning stale cache:', url.pathname);
						return cachedResponse;
					}
					
					// Return error response
					return new Response('Network error and no cached version available', {
						status: 503,
						statusText: 'Service Unavailable'
					});
				}
			})
	);
});

// Message event - handle cache management commands
self.addEventListener('message', (event) => {
	const { action, data } = event.data;
	
	switch (action) {
		case 'CLEAR_CACHE':
			caches.delete(CACHE_NAME).then(() => {
				event.ports[0].postMessage({ success: true });
			});
			break;
			
		case 'GET_CACHE_INFO':
			caches.open(CACHE_NAME).then(async (cache) => {
				const keys = await cache.keys();
				const info = {
					version: CACHE_VERSION,
					entries: keys.length,
					keys: keys.map(req => req.url)
				};
				event.ports[0].postMessage(info);
			});
			break;
			
		default:
			console.log('[SW] Unknown message action:', action);
	}
});