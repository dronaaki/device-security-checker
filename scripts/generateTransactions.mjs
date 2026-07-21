import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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

const PLANS = [
  { id: 'pro', price: 9.99, weight: 0.7 },
  { id: 'max', price: 19.99, weight: 0.3 }
];

const PROVIDERS = ['stripe', 'paypal'];
const STATUSES = [
  { status: 'success', weight: 0.85 },
  { status: 'failed', weight: 0.10 },
  { status: 'refunded', weight: 0.05 }
];

function weightedRandom(items) {
  const rand = Math.random();
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.weight;
    if (rand < cumulative) return item;
  }
  return items[items.length - 1];
}

async function generateTransactions(count = 150) {
  console.log(`Authenticating...`);
  try {
    await signInWithEmailAndPassword(auth, "mosaicmusic02@gmail.com", "Password123!");
    console.log("Successfully authenticated as superadmin.");
  } catch (err) {
    console.error("Failed to authenticate:", err);
    process.exit(1);
  }

  console.log(`Generating ${count} mock transactions...`);
  
  const now = new Date();
  let successCount = 0;

  for (let i = 0; i < count; i++) {
    // Generate dates over the past 6 months
    const daysAgo = Math.floor(Math.random() * 180);
    const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    const plan = weightedRandom(PLANS);
    const statusObj = weightedRandom(STATUSES);
    const provider = PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)];
    
    const transaction = {
      userId: `user_mock_${Math.floor(Math.random() * 1000)}`,
      userEmail: `user${Math.floor(Math.random() * 1000)}@example.com`,
      amount: plan.price,
      currency: 'USD',
      status: statusObj.status,
      provider: provider,
      planId: plan.id,
      timestamp: date.toISOString(),
      transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`
    };

    try {
      await addDoc(collection(db, 'transactions'), transaction);
      successCount++;
      if (successCount % 10 === 0) console.log(`Created ${successCount} transactions...`);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  console.log(`Successfully generated ${successCount} mock transactions!`);
  process.exit(0);
}

generateTransactions(150);
