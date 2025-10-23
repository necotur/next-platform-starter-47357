
// Service Worker for PWA Push Notifications
console.log('[Service Worker] Loading...');

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  let data = { title: 'New Notification', body: 'You have a new notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
      console.log('[Service Worker] Push data:', data);
    } catch (e) {
      console.error('[Service Worker] Failed to parse push data:', e);
      data = { title: 'New Notification', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'notification',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Seamless Smile Tracker', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);
  
  event.notification.close();

  // Get the data from the notification
  const data = event.notification.data;
  
  let url = '/';
  
  // Handle different notification types
  if (data.type === 'chat_message' && data.senderId) {
    url = `/chat?userId=${data.senderId}`;
  } else if (data.type === 'daily_reminder') {
    url = '/track';
  } else if (data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log('[Service Worker] Loaded successfully');
