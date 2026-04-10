const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

let accessToken = process.env.ZERODHA_ACCESS_TOKEN || "";

// GET /zerodha/login - Redirect user to Zerodha login page
router.get("/login", (req, res) => {
  const loginUrl = `https://kite.zerodha.com/connect/login?v=3&api_key=${process.env.ZERODHA_API_KEY}`;
  res.redirect(loginUrl);
});

// GET /zerodha/callback - Handle redirect after Zerodha login
router.get("/callback", async (req, res) => {
  const { request_token } = req.query;

  if (!request_token) {
    return res.status(400).send("Missing request_token from Zerodha");
  }

  try {
    // Generate checksum: SHA256(api_key + request_token + api_secret)
    const checksum = crypto
      .createHash("sha256")
      .update(
        process.env.ZERODHA_API_KEY +
          request_token +
          process.env.ZERODHA_API_SECRET
      )
      .digest("hex");

    // Exchange request_token for access_token
    const response = await axios.post(
      "https://api.kite.trade/session/token",
      new URLSearchParams({
        api_key: process.env.ZERODHA_API_KEY,
        request_token: request_token,
        checksum: checksum,
      }).toString(),
      {
        headers: {
          "X-Kite-Version": "3",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data?.data?.access_token;
    process.env.ZERODHA_ACCESS_TOKEN = accessToken;

    console.log("Zerodha access token obtained successfully");

    // Show success page that auto-closes
    res.send(`
      <html>
        <head><title>Zerodha Connected</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#1a1a2e;color:#fff;flex-direction:column;">
          <h1 style="color:#00C853;">✅ Zerodha Connected!</h1>
          <p>You can now place real orders from the app.</p>
          <p style="color:#aaa;">You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(
      "Zerodha token exchange error:",
      error.response?.data || error.message
    );
    res.status(500).send(`
      <html>
        <head><title>Connection Failed</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:#1a1a2e;color:#fff;flex-direction:column;">
          <h1 style="color:#FF1744;">❌ Connection Failed</h1>
          <p>${error.response?.data?.message || error.message}</p>
          <a href="/zerodha/login" style="color:#FF6B00;">Try Again</a>
        </body>
      </html>
    `);
  }
});

// GET /zerodha/status - Check if Zerodha is connected
router.get("/status", (req, res) => {
  res.json({
    connected: !!accessToken,
    message: accessToken
      ? "Zerodha is connected. You can place real orders."
      : "Zerodha not connected. Orders will be simulated.",
  });
});

module.exports = router;
