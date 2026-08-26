// Firebase Cloud Messaging Service Worker for Garden & Lawn Care Scheduler
// Enables background push notifications on iOS (iOS 16.4+ PWA) and all modern browsers

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
// Supports both standard env fallback and dynamic payload handling
try {
  firebase.initializeApp({
    apiKey: 'PLACEHOLDER_API_KEY',
    authDomain: 'gardencare-app.firebaseapp.com',
    projectId: 'gardencare-app',
    storageBucket: 'gardencare-app.appspot.com',
    messagingSenderId: '123456789012',
    appId: '1:123456789012:web:abcdef123456',
  });

  const messaging = firebase.messaging();

  // Background message handler for FCM payloads
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message received: ', payload);

    const notificationTitle =
      payload.notification?.title ||
      payload.data?.title ||
      '🌱 Garden & Lawn Care Alert';

    const notificationOptions = {
      body:
        payload.notification?.body ||
        payload.data?.body ||
        'Check your soil temperature and plant care schedule.',
      icon: payload.notification?.icon || '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: payload.data || {},
      tag: payload.data?.tag || 'gardencare-push-reminder',
      requireInteraction: false,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.log('[firebase-messaging-sw.js] Firebase SDK init fallback active:', e);
}

// Universal Web Push Listener (Catches both FCM and raw Web Push events)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Raw push event received');
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.notification?.title || data.title || '🌾 GardenCare Reminder';
    const options = {
      body: data.notification?.body || data.body || 'New care action is ready based on current soil temperature.',
      icon: data.notification?.icon || '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      data: data.data || data,
      tag: data.tag || 'garden-care-alert',
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    // If plaintext
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('🌾 GardenCare Notification', {
        body: text || 'Your garden care reminder',
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-192.svg',
      })
    );
  }
});

// Handle notification tap / click on iOS and Desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus already opened window if available
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Cache management for offline PWA operation
const CACHE_NAME = 'gardencare-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.hostname.includes('open-meteo.com') || url.hostname.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
  );
});
