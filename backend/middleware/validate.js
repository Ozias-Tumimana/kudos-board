// Request-body validation middleware.
// Each function enforces the "Request body" rules from the API Contracts
// (planning.md Section 2). On failure it responds 400 before the route handler
// runs; on success it calls next().

// Categories a board may belong to (matches the schema spec / filter options).
const VALID_CATEGORIES = ["celebration", "thank-you", "inspiration"];

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// POST /boards — requires title (string) and category (one of VALID_CATEGORIES).
// author and imageUrl are optional.
function validateBoard(req, res, next) {
  const { title, category } = req.body;

  if (!isNonEmptyString(title)) {
    return res.status(400).json({ error: "title is required and must be a non-empty string" });
  }
  if (!isNonEmptyString(category)) {
    return res.status(400).json({ error: "category is required and must be a non-empty string" });
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
    });
  }
  next();
}

// POST /cards (or POST /boards/:id/cards) — requires message and gifUrl.
// boardId is required in the body only when it's not supplied via the URL path.
// author is optional.
function validateCard(req, res, next) {
  const { message, gifUrl } = req.body;
  // boardId may come from the route param (POST /boards/:id/cards) or the body.
  const boardId = req.params.id ?? req.body.boardId;

  if (!isNonEmptyString(message)) {
    return res.status(400).json({ error: "message is required and must be a non-empty string" });
  }
  if (!isNonEmptyString(gifUrl)) {
    return res.status(400).json({ error: "gifUrl is required and must be a non-empty string" });
  }
  if (boardId === undefined || boardId === null || Number.isNaN(Number(boardId))) {
    return res.status(400).json({ error: "boardId is required and must be a number" });
  }
  next();
}

module.exports = { validateBoard, validateCard, VALID_CATEGORIES };
