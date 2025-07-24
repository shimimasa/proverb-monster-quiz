/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Skip waiting and claim clients
clientsClaim();
self.skipWaiting();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache names
const CACHE_NAMES = {
  static: 'static-v1',
  dynamic: 'dynamic-v1',
  data: 'data-v1',
  images: 'images-v1',
  offline: 'offline-v1'
};

// App Shell route
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  ({ request, url }: { request: Request; url: URL }) => {
    if (request.mode !== 'navigate') {
      return false;
    }
    if (url.pathname.startsWith('/_')) {
      return false;
    }
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }
    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// Static resources (JS, CSS)
registerRoute(
  ({ url }) => url.pathname.match(/\.(js|css|woff2?)$/),
  new CacheFirst({
    cacheName: CACHE_NAMES.static,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        maxEntries: 50,
      }),
    ],
  })
);

// Images
registerRoute(
  ({ url }) => url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/),
  new CacheFirst({
    cacheName: CACHE_NAMES.images,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        maxEntries: 100,
      }),
    ],
  })
);

// Data/API requests
registerRoute(
  ({ url }) => url.pathname.match(/\/(data|api)\//),
  new NetworkFirst({
    cacheName: CACHE_NAMES.data,
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
        maxEntries: 50,
      }),
    ],
  })
);

// Offline fallback
const OFFLINE_URL = '/offline.html';
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.offline).then((cache) => {
      return cache.add(OFFLINE_URL);
    })
  );
});

// Handle offline scenarios
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) as Promise<Response>;
      })
    );
  }
});

// Background sync for quiz results
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-quiz-results') {
    event.waitUntil(syncQuizResults());
  }
});

async function syncQuizResults() {
  // Get pending results from IndexedDB
  const db = await openDB();
  const tx = db.transaction('pending_results', 'readonly');
  const store = tx.objectStore('pending_results');
  const pendingResults = await store.getAll();
  
  for (const result of pendingResults) {
    try {
      // Attempt to sync with server
      await fetch('/api/quiz/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      
      // Remove from pending if successful
      const deleteTx = db.transaction('pending_results', 'readwrite');
      await deleteTx.objectStore('pending_results').delete(result.id);
    } catch (error) {
      console.error('Failed to sync result:', error);
    }
  }
}

// Simple IndexedDB helper
async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('ProverbMonsterDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('pending_results')) {
        db.createObjectStore('pending_results', { keyPath: 'id' });
      }
    };
  });
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'ことだまモンスターに新しいチャレンジが待っています！',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'クイズを始める',
      },
      {
        action: 'close',
        title: '閉じる',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification('ことだまモンスター', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/?start=quiz')
    );
  }
});

// Periodic background sync (for future use)
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'update-leaderboard') {
    event.waitUntil(updateLeaderboard());
  }
});

async function updateLeaderboard() {
  try {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();
    
    // Cache the updated leaderboard
    const cache = await caches.open(CACHE_NAMES.data);
    await cache.put('/api/leaderboard', new Response(JSON.stringify(data)));
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
  }
}

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.payload;
    event.waitUntil(
      caches.open(CACHE_NAMES.dynamic).then((cache) => {
        return cache.addAll(urlsToCache);
      })
    );
  }
});

// Export for TypeScript
export {};