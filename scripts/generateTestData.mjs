import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCsvx2xcsaJ1pL0xtnbZS0fXWc0Y4SYDCg",
  authDomain: "device-sec-checker-2026.firebaseapp.com",
  projectId: "device-sec-checker-2026",
  storageBucket: "device-sec-checker-2026.firebasestorage.app",
  messagingSenderId: "823856949464",
  appId: "1:823856949464:web:d9c6001561c243e8144fad"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const email = "testsubscriber2@example.com";
  const password = "Password123!";
  let user;

  try {
    console.log("Creating user...");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
    console.log("User created:", user.uid);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log("User exists. Signing in...");
      const cred = await signInWithEmailAndPassword(auth, email, password);
      user = cred.user;
      console.log("User signed in:", user.uid);
    } else {
      console.error(err);
      process.exit(1);
    }
  }

  const uid = user.uid;

  // 1. Create user document
  await setDoc(doc(db, 'users', uid), {
    email,
    displayName: "Test Subscriber",
    createdAt: new Date().toISOString(),
    isAdmin: false
  }, { merge: true });
  console.log("User document created.");

  // 2. Add some threat logs
  const threats = [
    { title: "Root Access Detected", description: "The device appears to be rooted or jailbroken.", type: "SYSTEM", severity: "HIGH" },
    { title: "Developer Options Enabled", description: "USB debugging is turned on.", type: "SYSTEM", severity: "MEDIUM" },
    { title: "Unsecured WiFi", description: "Connected to an open public WiFi network.", type: "NETWORK", severity: "HIGH" }
  ];

  for (let i = 0; i < threats.length; i++) {
    const t = threats[i];
    await addDoc(collection(db, 'users', uid, 'securityLogs'), {
      userId: uid,
      timestamp: Date.now() - (i * 86400000), // spread over last 3 days
      type: t.type,
      severity: t.severity,
      title: t.title,
      description: t.description,
      deviceInfo: {
        osName: "Android",
        osVersion: "13.0",
        deviceYearClass: 2022
      },
      actionTaken: "Logged"
    });
  }
  console.log("Threat logs added.");

  // 3. Add some notifications
  await addDoc(collection(db, 'users', uid, 'notifications'), {
    userId: uid,
    title: "Welcome to Device Security",
    message: "Thank you for installing our security app. Run your first scan today!",
    timestamp: Date.now() - 300000,
    read: false
  });
  await addDoc(collection(db, 'users', uid, 'notifications'), {
    userId: uid,
    title: "Critical Threat Found",
    message: "We detected an unsecured WiFi network. Please review.",
    timestamp: Date.now() - 100000,
    read: false
  });
  console.log("Notifications added.");

  // 4. Add some AI Chat history
  await addDoc(collection(db, 'users', uid, 'ai_conversations'), {
    userId: uid,
    role: "user",
    content: "What does Developer Options Enabled mean?",
    timestamp: Date.now() - 50000
  });
  await addDoc(collection(db, 'users', uid, 'ai_conversations'), {
    userId: uid,
    role: "assistant",
    content: "Developer Options is a hidden menu in Android that allows USB debugging. If left enabled, it could allow unauthorized users to extract data from your device if they gain physical access via a USB cable. I recommend turning it off.",
    timestamp: Date.now() - 40000
  });
  console.log("Chat logs added.");

  console.log("All test data generated successfully!");
  process.exit(0);
}

run().catch(console.error);
