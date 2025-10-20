import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const getFirebaseApiKey = (): string => {
  const key = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  if (!key) {
    console.error('EXPO_PUBLIC_FIREBASE_API_KEY is undefined');
    throw new Error(
      'Missing EXPO_PUBLIC_FIREBASE_API_KEY environment variable. Please set it in your .env file.'
    );
  }
  return key;
};

const getFirebaseAuthDomain = (): string => {
  const domain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  if (!domain) {
    console.error('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN is undefined');
    throw new Error(
      'Missing EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN environment variable. Please set it in your .env file.'
    );
  }
  return domain;
};

const getFirebaseProjectId = (): string => {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('EXPO_PUBLIC_FIREBASE_PROJECT_ID is undefined');
    throw new Error(
      'Missing EXPO_PUBLIC_FIREBASE_PROJECT_ID environment variable. Please set it in your .env file.'
    );
  }
  return projectId;
};

const getFirebaseStorageBucket = (): string => {
  const bucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    console.error('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET is undefined');
    throw new Error(
      'Missing EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable. Please set it in your .env file.'
    );
  }
  return bucket;
};

const getFirebaseMessagingSenderId = (): string => {
  const senderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  if (!senderId) {
    console.error('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is undefined');
    throw new Error(
      'Missing EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID environment variable. Please set it in your .env file.'
    );
  }
  return senderId;
};

const getFirebaseAppId = (): string => {
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  if (!appId) {
    console.error('EXPO_PUBLIC_FIREBASE_APP_ID is undefined');
    throw new Error(
      'Missing EXPO_PUBLIC_FIREBASE_APP_ID environment variable. Please set it in your .env file.'
    );
  }
  return appId;
};

const firebaseConfig = {
  apiKey: getFirebaseApiKey(),
  authDomain: getFirebaseAuthDomain(),
  projectId: getFirebaseProjectId(),
  storageBucket: getFirebaseStorageBucket(),
  messagingSenderId: getFirebaseMessagingSenderId(),
  appId: getFirebaseAppId(),
};

console.log('Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
});

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} else {
  app = getApp();
  console.log('Firebase already initialized, reusing existing instance');
}

export { app };
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const getFirebaseConfig = () => ({
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey,
  environment: process.env.NODE_ENV || 'development',
});
