// Auth middleware + JWT helpers (stretch: user accounts).
// Tokens are JWTs signed with JWT_SECRET (set in .env). Two guards:
//   - requireAuth: 401 unless a valid bearer token is present; sets req.user.
//   - optionalAuth: sets req.user when a valid token is present, else leaves it
//     undefined and continues (so anonymous/guest creation still works).
const jwt = require("jsonwebtoken");

// Fallback only for local dev so the server still boots without a .env entry.
// In any real deployment JWT_SECRET must be set.
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const TOKEN_TTL = "7d";

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: TOKEN_TTL,
  });
}

// Pull "Bearer <token>" out of the Authorization header and verify it.
// Returns the decoded payload ({ id, username }) or null.
function readToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = readToken(req);
  if (!payload) {
    return res.status(401).json({ error: "Authentication required" });
  }
  req.user = payload;
  next();
}

function optionalAuth(req, res, next) {
  const payload = readToken(req);
  if (payload) req.user = payload;
  next();
}

module.exports = { signToken, requireAuth, optionalAuth, JWT_SECRET };
