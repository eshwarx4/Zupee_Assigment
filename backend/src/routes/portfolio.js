const express = require("express");
const { db } = require("../config/firebase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// GET /portfolio
router.get("/", authMiddleware, async (req, res) => {
  console.log("Portfolio Request for User:", req.user?.uid);
  try {
    const snapshot = await db
      .collection("transactions")
      .where("userId", "==", req.user.uid)
      .orderBy("timestamp", "desc")
      .get();

    console.log(`Found ${snapshot.size} transactions for user ${req.user.uid}`);

    const investments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ investments });
  } catch (error) {
    console.error("Portfolio error:", error.message);
    return res.status(500).json({ error: "Failed to fetch portfolio" });
  }
});

module.exports = router;
