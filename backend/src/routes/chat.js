const express = require("express");
const Groq = require("groq-sdk");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT =
  "You are Bharat Nivesh Saathi, an Indian investment advisor AI. " +
  "You help users with investment advice tailored to Indian markets including " +
  "mutual funds, stocks (NSE/BSE), fixed deposits, PPF, NPS, gold, and real estate. " +
  "Always mention risks. Respond in a mix of Hindi and English (Hinglish) when appropriate. " +
  "Keep responses concise and actionable.";

// POST /chat
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";

    return res.json({ response: aiResponse });
  } catch (error) {
    console.error("Chat error:", error.message);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
});

module.exports = router;
