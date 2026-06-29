// Card routes — implements the "Cards" API Contracts (planning.md Section 2).
// Note: creating a card scoped to a board also has a nested route
// (POST /boards/:id/cards) defined in routes/boards.js. This file's POST /cards
// takes boardId from the request body.
//
// Stretch (M3): PATCH /cards/:id/pin toggles pin state; comments live under
// /cards/:id/comments. Optional auth associates created cards/comments with a user.
const express = require("express");
const prisma = require("../prismaClient");
const { validateCard } = require("../middleware/validate");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// POST /cards
// Create a card; boardId is supplied in the body. Validated by validateCard.
// Optional auth -> sets owner. Success: 201 -> created card (upvotes 0, pinned false).
// Errors: 400 (missing fields), 404 (board not found), 500.
router.post("/", optionalAuth, validateCard, async (req, res, next) => {
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
        userId: req.user?.id ?? null,
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

// PATCH /cards/:id/pin  (stretch: pinned cards)
// Toggle a card's pinned state. Body: none. Sets pinnedAt to now when pinning,
// null when unpinning (so pinned cards order by most-recently-pinned).
// Success: 200 -> updated card. Errors: 404, 500.
router.patch("/:id/pin", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(404).json({ error: "Card not found" });
    }

    const existing = await prisma.card.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Card not found" });
    }

    const willPin = !existing.pinned;
    const card = await prisma.card.update({
      where: { id },
      data: { pinned: willPin, pinnedAt: willPin ? new Date() : null },
    });
    res.status(200).json(card);
  } catch (err) {
    next(err);
  }
});

// DELETE /cards/:id
// Delete a card (comments cascade-delete). Success: 200 -> { message }. Errors: 404, 500.
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

// GET /cards/:id/comments  (stretch: comments)
// List a card's comments, oldest first. Success: 200 -> [ comment ]. Errors: 404, 500.
router.get("/:id/comments", async (req, res, next) => {
  try {
    const cardId = Number(req.params.id);
    if (Number.isNaN(cardId)) {
      return res.status(404).json({ error: "Card not found" });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    const comments = await prisma.comment.findMany({
      where: { cardId },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /cards/:id/comments  (stretch: comments)
// Add a comment to a card. Body: { content (required), author (optional) }.
// Optional auth -> sets userId. Success: 201 -> created comment.
// Errors: 400 (missing content), 404 (card not found), 500.
router.post("/:id/comments", optionalAuth, async (req, res, next) => {
  try {
    const cardId = Number(req.params.id);
    if (Number.isNaN(cardId)) {
      return res.status(404).json({ error: "Card not found" });
    }

    const { content, author } = req.body;
    if (!isNonEmptyString(content)) {
      return res
        .status(400)
        .json({ error: "content is required and must be a non-empty string" });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        author: author?.trim() || null,
        cardId,
        userId: req.user?.id ?? null,
      },
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
