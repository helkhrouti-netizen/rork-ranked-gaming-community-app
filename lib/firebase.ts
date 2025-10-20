import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

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
