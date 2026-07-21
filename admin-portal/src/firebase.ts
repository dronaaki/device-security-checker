import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsvx2xcsaJ1pL0xtnbZS0fXWc0Y4SYDCg",
  authDomain: "device-sec-checker-2026.firebaseapp.com",
  projectId: "device-sec-checker-2026",
  storageBucket: "device-sec-checker-2026.firebasestorage.app",
  messagingSenderId: "823856949464",
  appId: "1:823856949464:web:d9c6001561c243e8144fad"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
