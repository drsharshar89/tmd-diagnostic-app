// TMD Assessment App Service Worker
const CACHE_NAME = 'tmd-app-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/quick-assessment',
  '/comprehensive-assessment',
  '/results',
  '/favicon.ico',
  OFFLINE_URL,
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = {
  images: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
  fonts: /\.(?:woff|woff2|ttf|eot)$/i,
  api: /^https:\/\/api\./,
  cdn: /^https:\/\/cdn\./,
};

// Cache strategies
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'networkFirst',
  CACHE_FIRST: 'cacheFirst',
  STALE_WHILE_REVALIDATE: 'staleWhileRevalidate',
  NETWORK_ONLY: 'networkOnly',
  CACHE_ONLY: 'cacheOnly',
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  self.clients.claim();
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {});

// Handle fetch requests with appropriate caching strategy
async function handleFetch(request) {
  const url = new URL(request.url);

  try {
    // API requests - Network first
    if (RUNTIME_CACHE_PATTERNS.api.test(url.href)) {
      return await networkFirst(request, 'api-cache');
    }

    // Images - Cache first
    if (RUNTIME_CACHE_PATTERNS.images.test(url.pathname)) {
      return await cacheFirst(request, 'images-cache');
    }

    // Fonts - Cache first
    if (RUNTIME_CACHE_PATTERNS.fonts.test(url.pathname)) {
      return await cacheFirst(request, 'fonts-cache');
    }

    // HTML pages - Stale while revalidate
    if (request.headers.get('accept')?.includes('text/html')) {
      return await staleWhileRevalidate(request, CACHE_NAME);
    }

    // Static assets - Cache first
    if (url.pathname.includes('/static/')) {
      return await cacheFirst(request, 'static-cache');
    }

    // Default - Network first
    return await networkFirst(request, CACHE_NAME);
  } catch (error) {
    console.error('❌ Fetch failed:', error);
    return await handleFetchError(request);
  }
}

// Network first strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);

  const networkResponsePromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
        broadcastMessage({ type: 'CACHE_UPDATED', url: request.url });
      }
      return networkResponse;
    })
    .catch(() => null);

  return cachedResponse || (await networkResponsePromise);
}

// Update cache in background
async function updateCacheInBackground(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail background updates
  }
}

// Handle fetch errors
async function handleFetchError(request) {
  // For HTML requests, return offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
  }

  // For other requests, return a generic offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' },
  });
}

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'sync-assessments') {
    event.waitUntil(syncAssessments());
  }
});

// Sync offline assessments
async function syncAssessments() {
  try {
    console.log('📤 Syncing offline assessments...');

    // Get offline assessments from IndexedDB or local storage
    const offlineAssessments = await getOfflineAssessments();

    for (const assessment of offlineAssessments) {
      try {
        await uploadAssessment(assessment);
        await removeOfflineAssessment(assessment.id);
        console.log(`✅ Assessment ${assessment.id} synced successfully`);
      } catch (error) {
        console.error(`❌ Failed to sync assessment ${assessment.id}:`, error);
      }
    }

    broadcastMessage({
      type: 'BACKGROUND_SYNC_SUCCESS',
      count: offlineAssessments.length,
    });
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Get offline assessments
async function getOfflineAssessments() {
  // This would typically use IndexedDB
  // For now, we'll simulate with an empty array
  return [];
}

// Upload assessment
async function uploadAssessment(assessment) {
  // Simulate API call
  const response = await fetch('/api/assessments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assessment),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  return response.json();
}

// Remove offline assessment
async function removeOfflineAssessment(id) {
  // This would remove from IndexedDB
  console.log(`🗑️ Removing offline assessment: ${id}`);
}

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('📬 Push event received');

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'TMD Assessment';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/badge-icon.png',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    ...data.options,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window/tab is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message event - handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker received message:', event.data);

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
    case 'SAVE_OFFLINE_ASSESSMENT':
      saveOfflineAssessment(payload).then(() => {
        broadcastMessage({ type: 'OFFLINE_ASSESSMENT_SAVED', assessment: payload });
      });
      break;
  }
});

// Save offline assessment
async function saveOfflineAssessment(assessment) {
  // This would save to IndexedDB
  console.log('💾 Saving offline assessment:', assessment);
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('🗑️ All caches cleared');
}

// Broadcast message to all clients
function broadcastMessage(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// Periodic sync for background tasks
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);

  if (event.tag === 'assessment-cleanup') {
    event.waitUntil(cleanupOldAssessments());
  }
});

// Clean up old assessments
async function cleanupOldAssessments() {
  console.log('🧹 Cleaning up old assessments...');
  // Implementation would clean up expired assessments
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker unhandled rejection:', event.reason);
});

console.log('🚀 Service Worker loaded successfully');
