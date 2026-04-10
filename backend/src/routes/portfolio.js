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
      .get();

    console.log(`Found ${snapshot.size} transactions for user ${req.user.uid}`);

    // Sort in memory to avoid requiring a composite index for desc sorting
    const investments = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({ investments });
  } catch (error) {
    console.error("Portfolio error:", error);
    return res.status(500).json({
      error: "Failed to fetch portfolio",
      details: error.message
    });
  }
});

module.exports = router;
