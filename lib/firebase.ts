import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() || "AIzaSyB1E0e50TC5-41pQY1BGQrIF6bMMRuits4",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || "padelleague-a7097.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() || "padelleague-a7097",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || "padelleague-a7097.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || "770919915751",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() || "1:770919915751:web:c324ce2f1af5fd26e04242",
};

if (__DEV__) {
  console.log('🔥 Firebase Config (Debug):', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    apiKey: `${firebaseConfig.apiKey.substring(0, 5)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}`,
    apiKeyLength: firebaseConfig.apiKey.length,
  });
}

let app;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  if (__DEV__) {
    console.log('✅ Firebase initialized successfully');
  }
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  if (__DEV__) {
    console.log('✅ Firebase already initialized, reusing existing instance');
  }
}

export { app, auth, db };

export const getFirebaseConfig = () => ({
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey,
  apiKeyMasked: `${firebaseConfig.apiKey.substring(0, 5)}...${firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4)}`,
  apiKeyLength: firebaseConfig.apiKey.length,
  environment: process.env.NODE_ENV || 'development',
});
