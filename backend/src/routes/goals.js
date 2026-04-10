const express = require("express");
const { db } = require("../config/firebase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// POST /goals — Create a goal
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, targetAmount, currentAmount, deadline, category } = req.body;

    if (!name || targetAmount == null) {
      return res
        .status(400)
        .json({ error: "name and targetAmount are required" });
    }

    const goal = {
      userId: req.user.uid,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline: deadline || null,
      category: category || "general",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("goals").add(goal);

    return res.status(201).json({ id: docRef.id, ...goal });
  } catch (error) {
    console.error("Create goal error:", error.message);
    return res.status(500).json({ error: "Failed to create goal" });
  }
});

// GET /goals — List user's goals
router.get("/", authMiddleware, async (req, res) => {
  try {
    const snapshot = await db
      .collection("goals")
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const goals = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.json({ goals });
  } catch (error) {
    console.error("List goals error:", error.message);
    return res.status(500).json({ error: "Failed to fetch goals" });
  }
});

// PUT /goals/:id — Update a goal
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("goals").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Not authorized to update this goal" });
    }

    const updates = {};
    const allowedFields = ["name", "targetAmount", "currentAmount", "deadline", "category"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          field === "targetAmount" || field === "currentAmount"
            ? Number(req.body[field])
            : req.body[field];
      }
    }
    updates.updatedAt = new Date().toISOString();

    await docRef.update(updates);

    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("Update goal error:", error.message);
    return res.status(500).json({ error: "Failed to update goal" });
  }
});

// DELETE /goals/:id — Delete a goal
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection("goals").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: "Not authorized to delete this goal" });
    }

    await docRef.delete();

    return res.json({ success: true, message: "Goal deleted" });
  } catch (error) {
    console.error("Delete goal error:", error.message);
    return res.status(500).json({ error: "Failed to delete goal" });
  }
});

module.exports = router;
