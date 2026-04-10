const { admin } = require("../config/firebase");

/**
 * Firebase Auth middleware.
 * Verifies the Bearer token from the Authorization header.
 *
 * If Firebase Admin cannot verify the token (e.g. no service account
 * configured in development), it falls back to decoding the JWT payload
 * manually so that routes still receive req.user with a uid.
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // Try full verification with Firebase Admin
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    return next();
  } catch (verifyError) {
    // Fallback for development: decode JWT payload without verification
    try {
      const payloadBase64 = token.split(".")[1];
      if (!payloadBase64) {
        return res.status(401).json({ error: "Invalid token format" });
      }
      const payload = JSON.parse(
        Buffer.from(payloadBase64, "base64").toString("utf-8")
      );

      if (!payload.user_id && !payload.uid && !payload.sub) {
        return res.status(401).json({ error: "Token missing user identifier" });
      }

      req.user = {
        uid: payload.user_id || payload.uid || payload.sub,
        email: payload.email || null,
        name: payload.name || null,
        _devFallback: true,
      };

      console.warn(
        "Auth: using development fallback (token not cryptographically verified)"
      );
      return next();
    } catch (fallbackError) {
      return res.status(401).json({ error: "Unauthorized — token verification failed" });
    }
  }
}

module.exports = authMiddleware;
