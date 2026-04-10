const admin = require("firebase-admin");

// For production on Render, use a service account JSON file:
//   const serviceAccount = require("../../serviceAccountKey.json");
//   admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
//
// For development / when deploying without a service account file,
// we initialize with just the project ID. Note: token verification
// will not work without proper credentials — the auth middleware
// includes a development fallback for this case.

admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

module.exports = { admin, db };
