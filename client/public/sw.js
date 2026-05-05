// Service Worker v7 - aggressive cache busting
const CACHE_NAME = 'rafiq-v7';

self.addEventListener('install', (event) => {
  // Skip pre-caching to avoid stale files; rely on runtime cache
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete ALL old caches
      caches.keys().then(keys =>
        Promise.all(keys.map(k => caches.delete(k)))
      ),
      // Take control immediately
      self.clients.claim(),
    ])
  );
});

// Network-first strategy for HTML/JS/CSS - always fetch fresh
// Cache-first only for images and fonts
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isCriticalAsset = url.pathname.endsWith('.html') ||
                          url.pathname.endsWith('.js') ||
                          url.pathname.endsWith('.css') ||
                          url.pathname.endsWith('/') ||
                          url.pathname.endsWith('/sw.js');

  if (isCriticalAsset) {
    // Network-first: try fresh, fall back to cache
    event.respondWith(
      fetch(req).then(resp => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return resp;
      }).catch(() => caches.match(req).then(cached => {
        if (cached) return cached;
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      }))
    );
  } else {
    // Cache-first for images, fonts, etc.
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(resp => {
          if (resp && (resp.status === 200 || resp.type === 'opaque')) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
          }
          return resp;
        });
      })
    );
  }
});

// ============== NOTIFICATION HANDLING ==============

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

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

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkScheduledReminders());
  }
});

async function checkScheduledReminders() {
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'CHECK_REMINDERS', now: Date.now() }));
  } catch (e) {}
}
