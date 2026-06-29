// Card routes — implements the "Cards" API Contracts (planning.md Section 2).
// Note: creating a card scoped to a board also has a nested route
// (POST /boards/:id/cards) defined in routes/boards.js. This file's POST /cards
// takes boardId from the request body.
const express = require("express");
const prisma = require("../prismaClient");
const { validateCard } = require("../middleware/validate");

const router = express.Router();

// POST /cards
// Create a card; boardId is supplied in the body. Validated by validateCard.
// Success: 201 -> created card (upvotes defaults to 0).
// Errors: 400 (missing fields), 404 (board not found), 500.
router.post("/", validateCard, async (req, res, next) => {
  try {
    const { message, gifUrl, author } = req.body;
    const boardId = Number(req.body.boardId);

    const board = await prisma.board.findUnique({ where: { id: boardId } });
    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

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

// PATCH /cards/:id/upvote
// Increment a card's upvote count by 1. Body: none.
// Success: 200 -> updated card. Errors: 404, 500.
router.patch("/:id/upvote", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: "Card not found" });
    }

    const existing = await prisma.card.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Card not found" });
    }

    const card = await prisma.card.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });
    res.status(200).json(card);
  } catch (err) {
    next(err);
  }
});

// DELETE /cards/:id
// Delete a card. Success: 200 -> { message }. Errors: 404, 500.
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: "Card not found" });
    }

    const existing = await prisma.card.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Card not found" });
    }

    await prisma.card.delete({ where: { id } });
    res.status(200).json({ message: "Card deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
