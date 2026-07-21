const admin = require('firebase-admin');

// Initialize with default credentials
admin.initializeApp({
  projectId: "device-sec-checker-2026",
});

const args = process.argv.slice(2);
const email = args[0] || 'mosaicmusic02@gmail.com';

async function makeSuperadmin() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { superadmin: true });
    console.log(`Successfully granted superadmin privileges to ${email} (UID: ${user.uid})`);
    
    // Create/update the user document in Firestore to match
    const db = admin.firestore();
    await db.collection('users').doc(user.uid).set({
      email: user.email,
      displayName: user.displayName || '',
      isAdmin: true,
      role: 'Superadmin',
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
  } catch (error) {
    console.error(`Error granting superadmin to ${email}:`, error.message);
  } finally {
    process.exit(0);
  }
}

makeSuperadmin();
