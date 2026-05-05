// Service Worker - الإصدار 5
const CACHE_NAME = 'rafiq-v6';
const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch (e) {}
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        if (resp && (resp.status === 200 || resp.type === 'opaque')) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return resp;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// ============== NOTIFICATION HANDLING ==============

// Click on notification opens the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing window if open
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});

// Listen to messages from main app to schedule/show notifications
self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(data.title || 'الرفيق', {
      body: data.body || '',
      icon: data.icon || './icon-192.png',
      badge: './icon-192.png',
      tag: data.tag || 'default',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: { url: './' },
    });
  }

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic Background Sync - works on Chrome/Android when site is added to home screen
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkScheduledReminders());
  }
});

async function checkScheduledReminders() {
  // The main app stores upcoming notifications in IndexedDB
  // We check if any are due in the next 5 minutes
  try {
    const cache = await caches.open(CACHE_NAME);
    const now = Date.now();
    // Notify clients to do their scheduled checks
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'CHECK_REMINDERS', now }));
  } catch (e) {}
}
