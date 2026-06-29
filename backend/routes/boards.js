// Board routes — implements the "Boards" API Contracts (planning.md Section 2),
// plus the nested cards-by-board routes ("Route to add cards to a specific board
// and retrieve cards by board").
//
// Stretch (M3): optional auth associates created boards/cards with a user; the
// ?mine=true filter returns the current user's boards; DELETE enforces owner-only
// for boards that have an owner. Cards are returned pinned-first.
const express = require("express");
const prisma = require("../prismaClient");
const { validateBoard, validateCard } = require("../middleware/validate");
const { optionalAuth, requireAuth } = require("../middleware/auth");

const router = express.Router();

// Default board image used when the client omits imageUrl (spec: "default
// placeholder if omitted").
const DEFAULT_BOARD_IMAGE = "https://placehold.co/600x400?text=Kudos+Board";

// Pinned cards float to the top, most-recently-pinned first; then the rest by
// creation time. Reused by both cards-returning endpoints.
const CARD_ORDER = [
  { pinned: "desc" },
  { pinnedAt: "desc" },
  { createdAt: "desc" },
];

// GET /boards
// Returns all boards. Optional query params: category, recent=true, search.
// Stretch: mine=true (requires auth) -> only the current user's boards.
// Success: 200 -> [ { id, title, category, author, imageUrl, createdAt, userId } ]
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { category, recent, search, mine } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      // Case-insensitive substring match on title.
      where.title = { contains: search, mode: "insensitive" };
    }
    if (mine === "true") {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      where.userId = req.user.id;
    }

    // recent=true -> the 6 most recently created boards.
    const findArgs = {
      where,
      orderBy: { createdAt: "desc" },
    };
    if (recent === "true") {
      findArgs.take = 6;
    }

    const boards = await prisma.board.findMany(findArgs);
    res.status(200).json(boards);
  } catch (err) {
    next(err);
  }
});

// POST /boards
// Create a board. Validated by validateBoard. Optional auth -> sets owner.
// Success: 201 -> created board. Errors: 400 (invalid), 500.
router.post("/", optionalAuth, validateBoard, async (req, res, next) => {
  try {
    const { title, category, author, imageUrl } = req.body;

    const board = await prisma.board.create({
      data: {
        title: title.trim(),
        category,
        author: author?.trim() || null,
        imageUrl: imageUrl?.trim() || DEFAULT_BOARD_IMAGE,
        userId: req.user?.id ?? null,
      },
    });
    res.status(201).json(board);
  } catch (err) {
    next(err);
  }
});

// GET /boards/:id
// Get one board (without cards). Success: 200. Errors: 404, 500.
router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: "Board not found" });
    }

    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }
    res.status(200).json(board);
  } catch (err) {
    next(err);
  }
});

// DELETE /boards/:id
// Delete a board (cards cascade-delete via the schema relation).
// Stretch: if the board has an owner, only that owner may delete it (403).
// Guest boards (userId null) remain deletable by anyone.
// Success: 200 -> { message }. Errors: 401/403, 404, 500.
router.delete("/:id", optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: "Board not found" });
    }

    const existing = await prisma.board.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Board not found" });
    }

    // Owner-only delete for owned boards.
    if (existing.userId !== null) {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (req.user.id !== existing.userId) {
        return res
          .status(403)
          .json({ error: "Only the board owner can delete this board" });
      }
    }

    await prisma.board.delete({ where: { id } });
    res.status(200).json({ message: "Board deleted" });
  } catch (err) {
    next(err);
  }
});

// GET /boards/:id/cards
// Get all cards for a board, pinned-first. Success: 200 -> [ card ]. Errors: 404, 500.
router.get("/:id/cards", async (req, res, next) => {
  try {
    const boardId = Number(req.params.id);
    if (Number.isNaN(boardId)) {
      return res.status(404).json({ error: "Board not found" });
    }

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    const cards = await prisma.card.findMany({
      where: { boardId },
      orderBy: CARD_ORDER,
    });
    res.status(200).json(cards);
  } catch (err) {
    next(err);
  }
});

// POST /boards/:id/cards
// Create a card on a specific board (boardId comes from the URL path).
// Validated by validateCard. Optional auth -> sets owner.
// Success: 201 -> created card. Errors: 400, 404, 500.
router.post("/:id/cards", optionalAuth, validateCard, async (req, res, next) => {
  try {
    const boardId = Number(req.params.id);
    if (Number.isNaN(boardId)) {
      return res.status(404).json({ error: "Board not found" });
    }

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    const { message, gifUrl, author } = req.body;
    const card = await prisma.card.create({
      data: {
        message: message.trim(),
        gifUrl: gifUrl.trim(),
        author: author?.trim() || null,
        boardId,
        userId: req.user?.id ?? null,
      },
    });
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
