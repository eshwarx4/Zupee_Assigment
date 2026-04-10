const admin = require("firebase-admin");

// For production on Render, use a service account JSON file:
//   const serviceAccount = require("../../serviceAccountKey.json");
//   admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
//
// For development / when deploying without a service account file,
// we initialize with just the project ID. Note: token verification
// will not work without proper credentials — the auth middleware
// includes a development fallback for this case.

const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.resolve(__dirname, "../../serviceAccountKey.json");

// 1. Prioritize a single JSON string (Enables easy one-field paste on Render)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase Admin initialized with Full JSON ENV variable");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:", err.message);
  }
}
// 2. Granular environment variables
else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("🔥 Firebase Admin initialized with Granular ENV variables");
  } catch (err) {
    console.error("❌ Failed to initialize with granular variables:", err.message);
  }
}
// 3. Local file (Development)
else if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase Admin initialized with local Service Account file");
}
// 4. Fallback (Fails on Firestore writes)
else {
  console.warn("⚠️ NO FIREBASE CREDENTIALS FOUND. Initialization using Project ID only.");
  console.warn("Missing: FIREBASE_SERVICE_ACCOUNT or (FIREBASE_PRIVATE_KEY and FIREBASE_CLIENT_EMAIL)");
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'zupee-35ca1',
  });
}

const db = admin.firestore();

module.exports = { admin, db };
