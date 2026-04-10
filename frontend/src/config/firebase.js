import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBSHNJA8oyhUEqKaFrf6ODi98XhIklzXA0',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'zupee-35ca1.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'zupee-35ca1',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'zupee-35ca1.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '243983043888',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:243983043888:web:60045cc29c9e86e75a4cf5',
};

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const db = getFirestore(app);

export { auth, db };
export default app;
