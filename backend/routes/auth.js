// Auth routes (stretch: user accounts) — implements the Auth contracts in
// planning.md Section 2. Passwords are bcrypt-hashed; passwordHash is never
// returned. Signup/login return a JWT the frontend stores and sends as a
// "Authorization: Bearer <token>" header.
const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prismaClient");
const { signToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

const BCRYPT_ROUNDS = 10;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Shape a User row for API responses — strips passwordHash.
function publicUser(user) {
  return { id: user.id, username: user.username, createdAt: user.createdAt };
}

// POST /auth/signup — body { username, password }.
// 201 -> { token, user }. Errors: 400 missing fields; 409 username taken.
router.post("/signup", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { username: username.trim(), passwordHash },
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login — body { username, password }.
// 200 -> { token, user }. Errors: 400 missing fields; 401 invalid credentials.
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res
        .status(400)
        .json({ error: "username and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim() },
    });
    // Same response whether the user is missing or the password is wrong, so we
    // don't leak which usernames exist.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.status(200).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me — requires a valid bearer token. 200 -> public user.
// Used by the frontend to restore a session from a stored token on load.
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    res.status(200).json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
