// Firebase/Firestore-dependent storage functions.
//
// This module is intentionally separate from `storage.ts` and is only ever
// reached via a dynamic `import('./storage.cloud')`. Keeping it isolated
// means Vite/Rollup puts the whole Firebase SDK (auth + firestore) in its
// own chunk that is fetched only when a user actually signs in, instead of
// being bundled into the initial page load. This was the single biggest
// contributor to unused JavaScript reported by PageSpeed Insights.
import type { UserWordProgress, UserSettings, DeviceSession, UserProfile } from './types';
import { getFirebaseDb, getFirebaseAuth } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';
import { normalizeUserSettings, clearLocalProgress, getDeviceId, getDeviceInfo } from './storage';

/**
 * Clears the Firestore progress document for the given user.
 *
 * @param userId - Firebase User ID.
 */
export async function clearCloudProgress(userId: string): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) return;
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, { progressMap: {}, lastCompletedSessionDate: null, cardsReviewedToday: 0, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.error('Failed to clear cloud progress data:', e);
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
/**
 * Saves today's session completion metadata to Firebase Firestore.
 *
 * @param userId - Firebase User ID.
 * @param date - Date of completion formatted as YYYY-MM-DD.
 * @param cardsReviewedCount - Number of cards reviewed in today's session.
 */
export async function syncSessionCompletionToCloud(
  userId: string,
  date: string,
  cardsReviewedCount: number
): Promise<void> {
  try {
    const db = getFirebaseDb();
    if (!db) return;
    const userDocRef = doc(db, 'users', userId);
    await setDoc(
      userDocRef,
      {
        lastCompletedSessionDate: date,
        cardsReviewedToday: cardsReviewedCount,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Failed to sync session completion to Firestore:', e);
  }
}

/**
 * Loads session completion metadata from Firebase Firestore.
 *
 * @param userId - Firebase User ID.
 * @returns Object with date and count or null.
 */
export async function loadSessionCompletionFromCloud(
  userId: string
): Promise<{ lastCompletedSessionDate: string | null; cardsReviewedToday: number | null } | null> {
  try {
    const db = getFirebaseDb();
    if (!db) return null;
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        lastCompletedSessionDate: data?.lastCompletedSessionDate || null,
        cardsReviewedToday: typeof data?.cardsReviewedToday === 'number' ? data.cardsReviewedToday : null
      };
    }
  } catch (e) {
    console.warn('Failed to load session completion from Firestore:', e);
  }
  return null;
}

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
 * Permanently deletes user cloud data, local progress and the user account in Firebase Auth.
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

    clearLocalProgress();

    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      await deleteUser(auth.currentUser);
    }
  } catch (err) {
    console.error('Failed to delete user account:', err);
    throw err;
  }
}
