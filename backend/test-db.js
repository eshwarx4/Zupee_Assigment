const { db } = require("./src/config/firebase");
const FIREBASE_PROJECT_ID = "zupee-35ca1";
process.env.FIREBASE_PROJECT_ID = FIREBASE_PROJECT_ID;

async function check() {
    try {
        const snapshot = await db.collection("transactions").limit(1).get();
        console.log(`Connection test: ${snapshot.size > 0 ? "Found data!" : "No data yet, but connection works."}`);
    } catch (e) {
        console.error("Connection failed:", e.message);
    }
    process.exit();
}
check();
