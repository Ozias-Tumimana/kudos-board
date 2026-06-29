// Board routes — implements the "Boards" API Contracts (planning.md Section 2),
// plus the nested cards-by-board routes ("Route to add cards to a specific board
// and retrieve cards by board").
const express = require("express");
const prisma = require("../prismaClient");
const { validateBoard, validateCard } = require("../middleware/validate");

const router = express.Router();

// Default board image used when the client omits imageUrl (spec: "default
// placeholder if omitted").
const DEFAULT_BOARD_IMAGE = "https://placehold.co/600x400?text=Kudos+Board";

// GET /boards
// Returns all boards. Optional query params: category, recent=true, search.
// Success: 200 -> [ { id, title, category, author, imageUrl, createdAt } ]
router.get("/", async (req, res, next) => {
  try {
    const { category, recent, search } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      // Case-insensitive substring match on title.
      where.title = { contains: search, mode: "insensitive" };
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
// Create a board. Validated by validateBoard.
// Success: 201 -> created board. Errors: 400 (invalid), 500.
router.post("/", validateBoard, async (req, res, next) => {
  try {
    const { title, category, author, imageUrl } = req.body;

    const board = await prisma.board.create({
      data: {
        title: title.trim(),
        category,
        author: author?.trim() || null,
        imageUrl: imageUrl?.trim() || DEFAULT_BOARD_IMAGE,
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
// Success: 200 -> { message }. Errors: 404, 500.
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: "Board not found" });
    }

    const existing = await prisma.board.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Board not found" });
    }

    await prisma.board.delete({ where: { id } });
    res.status(200).json({ message: "Board deleted" });
  } catch (err) {
    next(err);
  }
});

// GET /boards/:id/cards
// Get all cards for a board. Success: 200 -> [ card ]. Errors: 404, 500.
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
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(cards);
  } catch (err) {
    next(err);
  }
});

// POST /boards/:id/cards
// Create a card on a specific board (boardId comes from the URL path).
// Validated by validateCard. Success: 201 -> created card. Errors: 400, 404, 500.
router.post("/:id/cards", validateCard, async (req, res, next) => {
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
      },
    });
    res.status(201).json(card);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
