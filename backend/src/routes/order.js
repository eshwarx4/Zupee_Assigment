const express = require("express");
const axios = require("axios");
const { db } = require("../config/firebase");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// POST /place-order
router.post("/", authMiddleware, async (req, res) => {
  console.log("Order Request Received:", req.body, "User:", req.user?.uid);
  try {
    let orderId, status;
    const { symbol, quantity, type, product } = req.body;

    if (!symbol || !quantity || !type || !product) {
      return res
        .status(400)
        .json({ error: "symbol, quantity, type, and product are required" });
    }

    if (!["BUY", "SELL"].includes(type)) {
      return res.status(400).json({ error: "type must be BUY or SELL" });
    }

    if (!["CNC", "MIS"].includes(product)) {
      return res.status(400).json({ error: "product must be CNC or MIS" });
    }

    // Fetch user's Zerodha token from Firestore
    const tokenDoc = await db
      .collection("users")
      .doc(req.user.uid)
      .collection("tokens")
      .doc("zerodha")
      .get();

    const accessToken = tokenDoc.exists ? tokenDoc.data().accessToken : null;

    if (accessToken) {
      // Place real order via Zerodha Kite API
      try {
        const response = await axios.post(
          "https://api.kite.trade/orders/regular",
          new URLSearchParams({
            tradingsymbol: symbol,
            exchange: "NSE",
            transaction_type: type,
            order_type: "MARKET",
            quantity: String(quantity),
            product: product,
            validity: "DAY",
          }).toString(),
          {
            headers: {
              "X-Kite-Version": "3",
              Authorization: `token ${process.env.ZERODHA_API_KEY}:${accessToken}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        orderId = response.data?.data?.order_id;
        status = "PLACED";
      } catch (kiteError) {
        console.error(
          "Zerodha order error:",
          kiteError.response?.data || kiteError.message
        );
        return res.status(500).json({
          error: "Failed to place order with Zerodha",
          details: kiteError.response?.data?.message || kiteError.message,
        });
      }
    } else {
      // Simulate order for development
      console.log("No Zerodha token found, simulating order...");
      orderId = "SIM_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
      status = "SIMULATED";
    }

    // Save transaction to Firestore
    const transaction = {
      userId: req.user.uid,
      symbol,
      quantity: Number(quantity),
      type,
      product,
      orderId,
      status,
      timestamp: new Date().toISOString(),
    };

    console.log("Saving transaction to Firestore:", transaction);
    const docRef = await db.collection("transactions").add(transaction);
    console.log("Transaction saved with ID:", docRef.id);

    return res.json({
      success: true,
      orderId,
      message:
        status === "SIMULATED"
          ? "Order simulated successfully (no Zerodha access token configured)"
          : "Order placed successfully via Zerodha",
    });
  } catch (error) {
    console.error("Order error:", error.message);
    return res.status(500).json({ error: "Failed to process order" });
  }
});

module.exports = router;
