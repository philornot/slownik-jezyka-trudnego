import type { NotificationTimeSlot, UserSettings } from './types';
import { NOTIFICATION_TIME_SLOTS } from './types';
import { getTodayDateString } from './supermemo';

const NOTIFICATION_SENT_KEY = 'sjt_notification_sent_date_v1';

// ─────────────────────────────────────────────────────────────────
// Service Worker registration
// ─────────────────────────────────────────────────────────────────

/**
 * Registers the application Service Worker.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (err) {
    console.error('Błąd rejestracji Service Workera:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────────────

/**
 * Asks the user for browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return await Notification.requestPermission();
}

// ─────────────────────────────────────────────────────────────────
// Scheduler
// ─────────────────────────────────────────────────────────────────

/**
 * Returns a random integer in the range [min, max).
 */
function randomIntInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Checks whether a notification has already been sent today.
 */
function wasNotificationSentToday(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const sent = localStorage.getItem(NOTIFICATION_SENT_KEY);
    return sent === getTodayDateString();
  } catch {
    return false;
  }
}

/**
 * Marks today's notification as sent.
 */
export function markNotificationSentToday(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATION_SENT_KEY, getTodayDateString());
  } catch {}
}

/**
 * Schedules a single daily notification via the Service Worker.
 *
 * How it works:
 *  1. Pick a random minute within the chosen time slot window.
 *  2. Calculate milliseconds until that moment.
 *  3. `postMessage` the delay to the SW which runs `setTimeout` and then calls
 *     `showNotification` when the timer fires.
 *
 * If the window for the chosen slot has already passed today, or a
 * notification was already sent today, this is a no-op.
 *
 * @param slot - The time-of-day slot chosen in Settings.
 */
export async function scheduleDailyNotification(slot: NotificationTimeSlot): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (wasNotificationSentToday()) return;

  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready.catch(() => null);
  if (!registration || !registration.active) return;

  const { startHour, endHour } = NOTIFICATION_TIME_SLOTS[slot];
  const now = new Date();
  const nowMs = now.getTime();

  // Build target fire time: random minute within [startHour, endHour)
  const targetHour = randomIntInRange(startHour, endHour);
  const targetMinute = randomIntInRange(0, 60);

  const target = new Date(now);
  target.setHours(targetHour, targetMinute, 0, 0);

  const delayMs = target.getTime() - nowMs;

  if (delayMs <= 0) {
    // The whole slot has already passed for today - skip; try again tomorrow.
    return;
  }

  // Ask the SW to fire a notification after `delayMs` milliseconds.
  registration.active.postMessage({
    type: 'SCHEDULE_NOTIFICATION',
    delayMs,
    title: 'Słownik Języka Trudnego',
    body: 'Czas na Twoją dzienną porcję pięknych polskich słów!'
  });
}

/**
 * Entry point called on every app start.
 * Schedules today's notification if notifications are enabled and
 * permission was granted. Safe to call multiple times per session.
 *
 * @param settings - Current user settings.
 */
export async function scheduleNotificationIfNeeded(settings: UserSettings): Promise<void> {
  if (!settings.notificationsEnabled) return;
  await scheduleDailyNotification(settings.notificationTimeSlot);
}
