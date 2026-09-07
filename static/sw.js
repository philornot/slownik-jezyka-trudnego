// Service Worker dla Słownika Języka Trudnego

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ─────────────────────────────────────────────────────────────────
// Scheduled notifications via postMessage
// ─────────────────────────────────────────────────────────────────
// The app calls `registration.active.postMessage({ type: 'SCHEDULE_NOTIFICATION',
// delayMs, title, body })`. The SW stores a single pending timer per session;
// any new schedule request replaces the previous one (safe to call on each app
// load because `notifications.ts` guards against re-scheduling when the
// notification was already sent today).

let scheduledTimer = null;

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'SCHEDULE_NOTIFICATION') return;

  const { delayMs, title, body } = data;

  // Clear any previously scheduled timer so re-opening the app doesn't
  // queue a second notification for the same day.
  if (scheduledTimer !== null) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }

  scheduledTimer = setTimeout(async () => {
    scheduledTimer = null;

    try {
      await self.registration.showNotification(title || 'Słownik Języka Trudnego', {
        body: body || 'Czas na Twoją dzienną porcję pięknych polskich słów!',
        icon: '/apple-touch-icon.png',
        badge: '/favicon-32x32.png',
        vibrate: [100, 50, 100],
        data: { url: self.location.origin }
      });

      // Notify all open tabs that the notification was shown so they can
      // persist the "sent today" flag in localStorage.
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'NOTIFICATION_SENT' });
      }
    } catch (err) {
      console.error('[SW] Failed to show scheduled notification:', err);
    }
  }, delayMs);
});

// ─────────────────────────────────────────────────────────────────
// External push notifications (future / optional)
// ─────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {
    title: 'Słownik Języka Trudnego',
    body: 'Czas na Twoją dzienną lekcję pięknych polskich słów!',
    icon: '/apple-touch-icon.png'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/apple-touch-icon.png',
      badge: '/favicon-32x32.png',
      vibrate: [100, 50, 100],
      data: { url: self.location.origin }
    })
  );
});

// ─────────────────────────────────────────────────────────────────
// Notification click handler
// ─────────────────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
