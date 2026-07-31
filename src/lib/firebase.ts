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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyForSltOnly12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "slownik-jezyka-trudnego.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "slownik-jezyka-trudnego",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "slownik-jezyka-trudnego.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === 'undefined') return undefined as unknown as FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

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
