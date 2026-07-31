/**
 * Rejestruje Service Worker w przeglądarce
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker zarejestrowany:', reg);
    return reg;
  } catch (err) {
    console.error('Błąd rejestracji Service Workera:', err);
    return null;
  }
}

/**
 * Prosi użytkownika o zgodę na powiadomienia przeglądarkowe
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Wyświetla testowe powiadomienie
 */
export function sendLocalNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.png'
    });
  }
}
