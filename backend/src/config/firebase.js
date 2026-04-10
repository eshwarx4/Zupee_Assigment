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

// 1. Prioritize granular environment variables (Recommended for Render)
if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
  try {
    // Restore newlines in private key
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
    console.error("❌ Failed to initialize Firebase with granular variables:", err.message);
  }
}
// 2. Fallback to local file (best for local development)
else if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  console.log("🔥 Firebase Admin initialized with local Service Account file");
}
// 3. Fallback to Project ID only (limited access)
else {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  console.log("⚠️ Firebase Admin initialized with Project ID only (Limited Access)");
}

const db = admin.firestore();

module.exports = { admin, db };
