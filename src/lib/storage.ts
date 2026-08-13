// NOTE: This module must stay free of any Firebase imports. It is imported
// eagerly from the main page, so anything imported here ships in the
// initial JS bundle. All cloud/Firestore-dependent functions live in
// `storage.cloud.ts`, which is only loaded via dynamic import() once a user
// actually signs in (see `getCloudStorage()` in +page.svelte).
import type { UserWordProgress, UserSettings } from './types';
import { getTodayDateString } from './supermemo';


const PROGRESS_STORAGE_KEY = 'sjt_user_progress_v1';
const SETTINGS_STORAGE_KEY = 'sjt_user_settings_v1';
const LAST_LOGIN_METHOD_KEY = 'sjt_last_login_method_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  preferredNotificationHour: 9,
  notificationsEnabled: false,
  dailyNewWordsLimit: 5,
  highContrast: false,
  reducedMotion: false,
  textSize: 'small'
};

/**
 * Normalizes user settings object to handle backward compatibility.
 *
 * @param raw - Partial or legacy user settings object.
 * @returns Complete UserSettings object.
 */
export function normalizeUserSettings(raw: any): UserSettings {
  const merged: UserSettings = { ...DEFAULT_SETTINGS, ...raw };
  if (!merged.textSize) {
    merged.textSize = raw?.largerText ? 'medium' : 'small';
  }
  return merged;
}

/**
 * Retrieves the last authentication method used by the user.
 *
 * @returns Last login method string or null if unavailable.
 */
export function getLastLoginMethod(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(LAST_LOGIN_METHOD_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the last authentication method used by the user.
 *
 * @param method - Authentication method name (e.g., 'google', 'email').
 */
export function saveLastLoginMethod(method: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LAST_LOGIN_METHOD_KEY, method);
  } catch (e) {
    console.warn('Failed to save login method to localStorage:', e);
  }
}

/**
 * Retrieves the user progress map from localStorage.
 *
 * @returns Record mapping word IDs to user word progress.
 */
export function getLocalProgressMap(): Record<string, UserWordProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read user progress from localStorage:', err);
    return {};
  }
}

/**
 * Saves progress for a single word to localStorage.
 *
 * @param progress - Updated word progress object.
 */
export function saveLocalWordProgress(progress: UserWordProgress): void {
  if (typeof window === 'undefined') return;
  try {
    const currentMap = getLocalProgressMap();
    currentMap[progress.wordId] = progress;
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(currentMap));
  } catch (err) {
    console.error('Failed to save word progress to localStorage:', err);
  }
}

/**
 * Saves the entire word progress map to localStorage.
 *
 * @param progressMap - Complete user word progress map.
 */
export function saveAllLocalProgress(progressMap: Record<string, UserWordProgress>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressMap));
  } catch (err) {
    console.error('Failed to save progress map to localStorage:', err);
  }
}

/**
 * Clears all local user study progress (localStorage only).
 * If the user is logged in, the caller is also responsible for clearing the
 * cloud copy via `clearCloudProgress()` from `storage.cloud.ts`.
 */
export function clearLocalProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    clearSavedSessionState();
  } catch (e) {
    console.error('Failed to clear local progress data:', e);
  }
}

/**
 * Retrieves user settings from localStorage.
 *
 * @returns UserSettings object merged with defaults.
 */
export function getLocalSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return normalizeUserSettings(JSON.parse(raw));
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Saves user settings to localStorage.
 *
 * @param settings - User settings object to persist.
 */
export function saveLocalSettings(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save user settings to localStorage:', err);
  }
}


export interface SavedSessionProgress {
  date: string;
  sessionPhase: 'showcase' | 'quiz';
  currentCardIndex: number;
  cardsReviewedInSession: number;
  sessionCompleted: boolean;
}

const ACTIVE_SESSION_STORAGE_KEY = 'sjt_active_session_state_v1';

/**
 * Retrieves the saved session progress state for today.
 * Uses local timezone date string matching for date validation.
 *
 * @returns SavedSessionProgress or null if expired/not found.
 */
export function getSavedSessionState(): SavedSessionProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: SavedSessionProgress = JSON.parse(raw);
    const today = getTodayDateString();
    if (parsed.date === today) {
      return parsed;
    }
  } catch {}
  return null;
}

/**
 * Persists the current session state to localStorage.
 *
 * @param state - Session state object.
 */
export function saveSessionState(state: SavedSessionProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Clears saved session state from localStorage.
 */
export function clearSavedSessionState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  } catch {}
}

/**
 * Merges local and cloud progress maps for user word progress.
 * For each word ID present in either map, the entry with the most recent `lastReviewedAt` timestamp wins.
 * If timestamps are equal or missing, the local entry is preferred.
 *
 * @param local - The local word progress map.
 * @param cloud - The cloud word progress map.
 * @returns The merged progress map.
 */
export function mergeProgressMaps(
  local: Record<string, UserWordProgress>,
  cloud: Record<string, UserWordProgress>
): Record<string, UserWordProgress> {
  const merged: Record<string, UserWordProgress> = { ...cloud, ...local };
  const allWordIds = new Set([...Object.keys(local), ...Object.keys(cloud)]);

  for (const wordId of allWordIds) {
    const localEntry = local[wordId];
    const cloudEntry = cloud[wordId];

    if (localEntry && cloudEntry) {
      const localTime = localEntry.lastReviewedAt ?? '';
      const cloudTime = cloudEntry.lastReviewedAt ?? '';

      if (cloudTime > localTime) {
        merged[wordId] = cloudEntry;
      } else {
        merged[wordId] = localEntry;
      }
    } else if (localEntry) {
      merged[wordId] = localEntry;
    } else if (cloudEntry) {
      merged[wordId] = cloudEntry;
    }
  }

  return merged;
}

const DEVICE_ID_KEY = 'sjt_device_id_v1';

/**
 * Retrieves or generates a unique persistent device ID for this browser.
 *
 * @returns Persistent device ID string.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'dev_' + Date.now();
  }
}

/**
 * Returns a human-friendly label for the current device based on userAgent.
 *
 * @returns Device description string (e.g. "Chrome (Windows)").
 */
export function getDeviceInfo(): string {
  if (typeof window === 'undefined') return 'Urządzenie komputera';
  const ua = navigator.userAgent;
  let os = 'System';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Przeglądarka';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  return `${browser} (${os})`;
}



