import type { UserWordProgress, UserSettings } from './types';
import { getFirebaseDb } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
  largerText: false
};

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
 * Clears all local user study progress and resets Firestore user progress if logged in.
 *
 * @param userId - Optional user ID for resetting Firestore data.
 */
export async function clearAllProgress(userId?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    if (userId) {
      const db = getFirebaseDb();
      if (db) {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, { progressMap: {}, updatedAt: new Date().toISOString() }, { merge: true });
      }
    }
  } catch (e) {
    console.error('Failed to clear progress data:', e);
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
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
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

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSyncUid: string | null = null;
let pendingSyncMap: Record<string, UserWordProgress> | null = null;

/**
 * Flushes any pending progress sync queue immediately to Firestore.
 */
export async function flushSyncProgressToCloud(): Promise<void> {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  if (pendingSyncUid && pendingSyncMap) {
    const uid = pendingSyncUid;
    const map = pendingSyncMap;
    pendingSyncUid = null;
    pendingSyncMap = null;
    try {
      const db = getFirebaseDb();
      if (!db) return;
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, { progressMap: map, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn('Failed to sync progress to Firebase Firestore:', e);
    }
  }
}

/**
 * Schedules a debounced sync of user progress to Firestore (2.5 seconds delay).
 *
 * @param userId - Firebase User ID.
 * @param progressMap - Complete user word progress map.
 */
export function syncProgressToCloud(userId: string, progressMap: Record<string, UserWordProgress>): void {
  pendingSyncUid = userId;
  pendingSyncMap = progressMap;

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(() => {
    flushSyncProgressToCloud();
  }, 2500);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    flushSyncProgressToCloud();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSyncProgressToCloud();
    }
  });
}

/**
 * Retrieves user progress map from Firebase Firestore.
 *
 * @param userId - Firebase User ID.
 * @returns Progress map or null if empty/failed.
 */
export async function loadProgressFromCloud(userId: string): Promise<Record<string, UserWordProgress> | null> {
  try {
    const db = getFirebaseDb();
    if (!db) return null;
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data()?.progressMap) {
      return snap.data().progressMap as Record<string, UserWordProgress>;
    }
  } catch (e) {
    console.warn('Failed to load user progress from Firebase Firestore:', e);
  }
  return null;
}

/**
 * Saves user settings to Firebase Firestore.
 *
 * @param userId - Firebase User ID.
 * @param settings - User settings object.
 */
export async function saveSettingsToCloud(userId: string, settings: UserSettings): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) return;
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { settings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Failed to save settings to Firebase Firestore:', e);
  }
}

/**
 * Loads user settings from Firebase Firestore.
 *
 * @param userId - Firebase User ID.
 * @returns UserSettings object or null if not found.
 */
export async function loadSettingsFromCloud(userId: string): Promise<UserSettings | null> {
  try {
    const db = getFirebaseDb();
    if (!db) return null;
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data()?.settings) {
      return { ...DEFAULT_SETTINGS, ...snap.data().settings } as UserSettings;
    }
  } catch (e) {
    console.warn('Failed to load settings from Firebase Firestore:', e);
  }
  return null;
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


