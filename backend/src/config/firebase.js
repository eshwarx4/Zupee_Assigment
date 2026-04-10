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

// 1. Prioritize environment variable (best for cloud hosts like Render)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    // Fix for nested newlines that often get garbled in env vars
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log("🔥 Firebase Admin initialized with Service Account from ENV");
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env var:", err.message);
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
