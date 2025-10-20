import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB1E0e50TC5-41pQY1BGQrIF6bMMRuits4",
  authDomain: "padelleague-a7097.firebaseapp.com",
  projectId: "padelleague-a7097",
  storageBucket: "padelleague-a7097.appspot.com",
  messagingSenderId: "770919915751",
  appId: "1:770919915751:web:c324ce2f1af5fd26e04242",
};

console.log('Firebase config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
});

let app;
let auth;
let db: Firestore;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, { 
    persistence: getReactNativePersistence(AsyncStorage) 
  });
  db = getFirestore(app);
  console.log('Firebase initialized successfully with AsyncStorage persistence');
} else {
  const { getApp } = require('firebase/app');
  const { getAuth } = require('firebase/auth');
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('Firebase already initialized, reusing existing instance');
}

export { app, auth, db };

export const getFirebaseConfig = () => ({
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  apiKey: firebaseConfig.apiKey,
  environment: process.env.NODE_ENV || 'development',
});
