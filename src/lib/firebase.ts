import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type Auth
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

/**
 * Initializes and returns the FirebaseApp instance.
 * Throws an error if key environment variables (API Key and Project ID) are not configured.
 *
 * @returns Initialized FirebaseApp instance.
 * @throws Error if Firebase environment variables are missing.
 */
export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') return undefined as unknown as FirebaseApp;

  if (!apiKey || !projectId) {
    console.error(
      'Firebase configuration error: VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID environment variables must be defined.'
    );
    throw new Error(
      'Firebase environment variables missing (VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID).'
    );
  }

  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

/**
 * Returns the FirebaseAuth instance.
 *
 * @returns FirebaseAuth instance.
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

/**
 * Returns the Firestore database instance.
 *
 * @returns Firestore instance.
 */
export function getFirebaseDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    db = getFirestore(firebaseApp);
  }
  return db;
}

export const googleProvider = new GoogleAuthProvider();

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
};

