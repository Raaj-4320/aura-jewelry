import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { logDB, logError, logSystem } from './utils/logger';

const requiredFirebaseEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const missingFirebaseEnvVars = requiredFirebaseEnvVars.filter((envVar) => {
  const value = import.meta.env[envVar];
  return typeof value !== 'string' || value.trim().length === 0;
});

if (missingFirebaseEnvVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingFirebaseEnvVars.join(', ')}. ` +
      'Set these in your local .env file and in Vercel Project Settings → Environment Variables.',
  );
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

logSystem('firebase_init_start', { hasProjectId: !!firebaseConfig.projectId });
const app = initializeApp(firebaseConfig);
logSystem('firebase_init_success', { projectId: firebaseConfig.projectId });
export const auth = getAuth(app);
export const db = getFirestore(app);
logDB('firestore_ready', { ok: true });
