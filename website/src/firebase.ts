import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyMockApiKeyForDeviceSecChecker",
  authDomain: "device-sec-checker-2026.firebaseapp.com",
  projectId: "device-sec-checker-2026",
  storageBucket: "device-sec-checker-2026.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
