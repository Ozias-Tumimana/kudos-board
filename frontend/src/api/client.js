// Mock API client for Milestone 1 (frontend-only).
//
// This module mirrors the API contracts documented in planning.md (Section 2)
// exactly — same routes, request shapes, response shapes and error cases — but is
// backed by localStorage instead of a real Express/Prisma backend (which is built
// in Milestone 2). Components consume these promise-returning functions today; in
// Milestone 3 we swap the bodies for `fetch` calls to the real API and the rest of
// the frontend stays unchanged.

const STORAGE_KEY = 'kudos-board:db';
const NETWORK_DELAY_MS = 150; // simulate async so loading states are real

// Categories per planning.md schema spec.
export const CATEGORIES = ['celebration', 'thank-you', 'inspiration'];

const PLACEHOLDER_IMAGES = {
  celebration: 'https://picsum.photos/seed/celebration/600/400',
  'thank-you': 'https://picsum.photos/seed/thankyou/600/400',
  inspiration: 'https://picsum.photos/seed/inspiration/600/400',
  default: 'https://picsum.photos/seed/kudos/600/400',
};

function placeholderFor(category) {
  return PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.default;
}

// ---- seed data -------------------------------------------------------------

function seed() {
  const now = Date.now();
  const boards = [
    {
      id: 1,
      title: 'Team Wins This Sprint',
      category: 'celebration',
      author: 'Maya',
      imageUrl: 'https://picsum.photos/seed/teamwins/600/400',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      id: 2,
      title: 'Thank You, Mentors',
      category: 'thank-you',
      author: 'Ozias',
      imageUrl: 'https://picsum.photos/seed/mentors/600/400',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 3).toISOString(),
    },
    {
      id: 3,
      title: 'Daily Inspiration',
      category: 'inspiration',
      author: null,
      imageUrl: 'https://picsum.photos/seed/inspire/600/400',
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
  ];
  const cards = [
    {
      id: 1,
      message: 'Amazing work shipping the release on time!',
      gifUrl: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
      author: 'Maya',
      upvotes: 4,
      boardId: 1,
      createdAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
    },
    {
      id: 2,
      message: 'Thanks for always answering my questions.',
      gifUrl: 'https://media.giphy.com/media/l4pTfx2qLszoacZRS/giphy.gif',
      author: null,
      upvotes: 2,
      boardId: 2,
      createdAt: new Date(now - 1000 * 60 * 60 * 10).toISOString(),
    },
  ];
  return { boards, cards, nextBoardId: 4, nextCardId: 3 };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to seed
  }
  const fresh = seed();
  save(fresh);
  return fresh;
}

function save(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), NETWORK_DELAY_MS));
}

// Error that carries an HTTP-like status, matching the documented error cases.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---- Boards ----------------------------------------------------------------

// GET /boards  (supports ?category, ?recent=true, ?search)
export function getBoards({ category, recent, search } = {}) {
  const db = load();
  let boards = [...db.boards];

  if (category && CATEGORIES.includes(category)) {
    boards = boards.filter((b) => b.category === category);
  }
  if (search) {
    const q = search.trim().toLowerCase();
    boards = boards.filter((b) => b.title.toLowerCase().includes(q));
  }
  boards.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (recent) {
    boards = boards.slice(0, 6);
  }
  return delay(boards);
}

// GET /boards/:id
export function getBoard(id) {
  const db = load();
  const board = db.boards.find((b) => b.id === Number(id));
  if (!board) return Promise.reject(new ApiError(404, 'Board not found'));
  return delay(board);
}

// POST /boards
export function createBoard({ title, category, author, imageUrl }) {
  if (!title || !title.trim()) {
    return Promise.reject(new ApiError(400, 'title is required'));
  }
  if (!category || !CATEGORIES.includes(category)) {
    return Promise.reject(new ApiError(400, 'category is required and must be valid'));
  }
  const db = load();
  const board = {
    id: db.nextBoardId++,
    title: title.trim(),
    category,
    author: author && author.trim() ? author.trim() : null,
    imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : placeholderFor(category),
    createdAt: new Date().toISOString(),
  };
  db.boards.push(board);
  save(db);
  return delay(board);
}

// DELETE /boards/:id  (cascade-deletes its cards)
export function deleteBoard(id) {
  const db = load();
  const idx = db.boards.findIndex((b) => b.id === Number(id));
  if (idx === -1) return Promise.reject(new ApiError(404, 'Board not found'));
  db.boards.splice(idx, 1);
  db.cards = db.cards.filter((c) => c.boardId !== Number(id));
  save(db);
  return delay({ message: 'Board deleted' });
}

// ---- Cards -----------------------------------------------------------------

// GET /boards/:id/cards
export function getCards(boardId) {
  const db = load();
  const board = db.boards.find((b) => b.id === Number(boardId));
  if (!board) return Promise.reject(new ApiError(404, 'Board not found'));
  const cards = db.cards
    .filter((c) => c.boardId === Number(boardId))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return delay(cards);
}

// POST /cards
export function createCard({ message, gifUrl, author, boardId }) {
  if (!message || !message.trim()) {
    return Promise.reject(new ApiError(400, 'message is required'));
  }
  if (!gifUrl || !gifUrl.trim()) {
    return Promise.reject(new ApiError(400, 'gifUrl is required'));
  }
  if (!boardId) {
    return Promise.reject(new ApiError(400, 'boardId is required'));
  }
  const db = load();
  const board = db.boards.find((b) => b.id === Number(boardId));
  if (!board) return Promise.reject(new ApiError(404, 'Board not found'));
  const card = {
    id: db.nextCardId++,
    message: message.trim(),
    gifUrl: gifUrl.trim(),
    author: author && author.trim() ? author.trim() : null,
    upvotes: 0,
    boardId: Number(boardId),
    createdAt: new Date().toISOString(),
  };
  db.cards.push(card);
  save(db);
  return delay(card);
}

// PATCH /cards/:id/upvote
export function upvoteCard(id) {
  const db = load();
  const card = db.cards.find((c) => c.id === Number(id));
  if (!card) return Promise.reject(new ApiError(404, 'Card not found'));
  card.upvotes += 1;
  save(db);
  return delay(card);
}

// DELETE /cards/:id
export function deleteCard(id) {
  const db = load();
  const idx = db.cards.findIndex((c) => c.id === Number(id));
  if (idx === -1) return Promise.reject(new ApiError(404, 'Card not found'));
  db.cards.splice(idx, 1);
  save(db);
  return delay({ message: 'Card deleted' });
}
