import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, GoogleAuthProvider } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCsvx2xcsaJ1pL0xtnbZS0fXWc0Y4SYDCg",
  authDomain: "device-sec-checker-2026.firebaseapp.com",
  projectId: "device-sec-checker-2026",
  storageBucket: "device-sec-checker-2026.firebasestorage.app",
  messagingSenderId: "823856949464",
  appId: "1:823856949464:web:d9c6001561c243e8144fad"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let authInstance;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    const authModule = require('firebase/auth');
    if (authModule.getReactNativePersistence) {
      authInstance = initializeAuth(app, {
        persistence: authModule.getReactNativePersistence(AsyncStorage)
      });
    } else {
      authInstance = getAuth(app);
    }
  } catch (e) {
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export default app;
