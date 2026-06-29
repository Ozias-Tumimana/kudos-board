// Kudos Board — Express API entry point.
// Implements the API Contracts in planning.md (Section 2).
// Routes are split into routes/boards.js and routes/cards.js.
require("dotenv/config");

const express = require("express");
const cors = require("cors");

const boardsRouter = require("./routes/boards");
const cardsRouter = require("./routes/cards");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

// --- Global middleware ---
app.use(cors()); // allow the frontend (different port) to call this API in Milestone 3
app.use(express.json()); // parse JSON request bodies

// --- Health check (handy for sanity-testing the server is up) ---
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "kudos-board-api" });
});

// --- Feature routes ---
app.use("/auth", authRouter); // stretch: user accounts
app.use("/boards", boardsRouter);
app.use("/cards", cardsRouter);

// --- 404 for unknown routes ---
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// --- Centralized error handler (the "500 on db failure" cases in the contracts) ---
// Express 5 forwards errors thrown in async handlers passed to next(err) here.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Kudos Board API listening on http://localhost:${PORT}`);
});

module.exports = app;
