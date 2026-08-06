import type { UserWordProgress, UserSettings, DeviceSession, UserProfile } from './types';
import { getFirebaseDb, getFirebaseAuth } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';
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
 * Clears all local user study progress and resets Firestore user progress if logged in.
 *
 * @param userId - Optional user ID for resetting Firestore data.
 */
export async function clearAllProgress(userId?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
      syncDebounceTimer = null;
    }
    pendingSyncUid = null;
    pendingSyncMap = null;

    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    clearSavedSessionState();
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
 * Saves user settings to Firebase Firestore (excluding device-specific notifications setting).
 *
 * @param userId - Firebase User ID.
 * @param settings - User settings object.
 */
export async function saveSettingsToCloud(userId: string, settings: UserSettings): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) return;
    const userDocRef = doc(db, 'users', userId);
    const { notificationsEnabled, ...cloudSettings } = settings;
    await setDoc(userDocRef, { settings: cloudSettings, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Failed to save settings to Firebase Firestore:', e);
  }
}

/**
 * Loads user settings from Firebase Firestore (excluding device-specific notifications setting).
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
      const settingsData = { ...snap.data().settings };
      delete settingsData.notificationsEnabled;
      return normalizeUserSettings(settingsData);
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

/**
 * Registers or refreshes the current device session in Firestore user document.
 *
 * @param userId - Firebase User ID.
 * @param userEmail - Optional email of the user.
 * @returns Active DeviceSession object.
 */
export async function registerDeviceSession(userId: string, userEmail?: string | null): Promise<DeviceSession | null> {
  try {
    const db = getFirebaseDb();
    if (!db) return null;
    const deviceId = getDeviceId();
    const deviceName = getDeviceInfo();
    const now = new Date().toISOString();

    const deviceData: DeviceSession = {
      id: deviceId,
      name: deviceName,
      lastActive: now,
      createdAt: now
    };

    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);

    let existingDevices: Record<string, DeviceSession> = {};
    if (snap.exists() && snap.data()?.devices) {
      existingDevices = snap.data().devices;
    }

    if (existingDevices[deviceId]?.createdAt) {
      deviceData.createdAt = existingDevices[deviceId].createdAt;
    }

    existingDevices[deviceId] = deviceData;

    const payload: Record<string, any> = {
      devices: existingDevices,
      updatedAt: now
    };
    if (userEmail) {
      payload.email = userEmail;
    }

    await setDoc(userDocRef, payload, { merge: true });
    return { ...deviceData, isCurrent: true };
  } catch (err) {
    console.warn('Failed to register device session in Firestore:', err);
    return null;
  }
}

/**
 * Loads user profile data (username, email, devices) from Firestore.
 *
 * @param userId - Firebase User ID.
 * @returns UserProfile object or null.
 */
export async function loadUserProfileFromCloud(userId: string): Promise<UserProfile | null> {
  try {
    const db = getFirebaseDb();
    if (!db) return null;
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid: userId,
        email: data.email || null,
        username: data.username || data.displayName || null,
        devices: data.devices || {},
        sessionRevokedAt: data.sessionRevokedAt || null,
        updatedAt: data.updatedAt
      };
    }
  } catch (err) {
    console.warn('Failed to load user profile from Firestore:', err);
  }
  return null;
}

/**
 * Saves or updates username in Firestore and Firebase Auth profile.
 *
 * @param userId - Firebase User ID.
 * @param newUsername - New display username string.
 */
export async function saveUsernameToCloud(userId: string, newUsername: string): Promise<void> {
  const trimmed = newUsername.trim();
  try {
    const db = getFirebaseDb();
    if (db) {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, { username: trimmed, displayName: trimmed, updatedAt: new Date().toISOString() }, { merge: true });
    }

    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: trimmed });
    }
  } catch (err) {
    console.error('Failed to save username to cloud:', err);
    throw err;
  }
}

/**
 * Revokes all device sessions for a user in Firestore.
 *
 * @param userId - Firebase User ID.
 */
export async function logoutAllDevicesInCloud(userId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) return;
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        devices: {},
        sessionRevokedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Failed to logout all devices in cloud:', err);
    throw err;
  }
}

/**
 * Permanently deletes user cloud data and user account in Firebase Auth.
 *
 * @param userId - Firebase User ID.
 */
export async function deleteUserAccount(userId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (db) {
      const userDocRef = doc(db, 'users', userId);
      await deleteDoc(userDocRef);
    }

    await clearAllProgress(userId);

    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      await deleteUser(auth.currentUser);
    }
  } catch (err) {
    console.error('Failed to delete user account:', err);
    throw err;
  }
}



