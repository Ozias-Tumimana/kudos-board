// API client for Milestone 3 — real HTTP calls to the Express backend.
//
// This replaces the Milestone 1 localStorage mock. Every function maps to a
// documented endpoint in planning.md (Section 2); the request/response shapes are
// unchanged, so the components that consumed the mock keep working as-is.
//
// Auth (stretch): AuthContext calls setAuthToken() so mutating/owner-scoped
// requests carry "Authorization: Bearer <token>". The token also seeds from
// localStorage on load so a refresh keeps you signed in until /auth/me confirms.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Categories per planning.md schema spec (still consumed by CreateBoardModal).
export const CATEGORIES = ['celebration', 'thank-you', 'inspiration'];

// Error that carries the HTTP status so callers can branch on it if needed.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// --- auth token plumbing ----------------------------------------------------

const TOKEN_KEY = 'kudos-board:token';
let authToken = localStorage.getItem(TOKEN_KEY) || null;

export function setAuthToken(token) {
  authToken = token;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getStoredToken() {
  return authToken;
}

// --- core fetch helper ------------------------------------------------------

// Builds a querystring from a params object, omitting empty values.
function toQuery(params = {}) {
  const usable = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (usable.length === 0) return '';
  const q = new URLSearchParams();
  for (const [k, v] of usable) q.set(k, String(v));
  return `?${q.toString()}`;
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network failure / server down.
    throw new ApiError(0, 'Could not reach the server. Is the backend running?');
  }

  // 204 No Content (or empty body) -> nothing to parse.
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = (data && data.error) || `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }
  return data;
}

// --- Boards -----------------------------------------------------------------

// GET /boards  (supports ?category, ?recent=true, ?search, ?mine=true)
export function getBoards({ category, recent, search, mine } = {}) {
  return request(
    `/boards${toQuery({
      category,
      recent: recent ? 'true' : undefined,
      search,
      mine: mine ? 'true' : undefined,
    })}`
  );
}

// GET /boards/:id
export function getBoard(id) {
  return request(`/boards/${id}`);
}

// POST /boards
export function createBoard({ title, category, author, imageUrl }) {
  return request('/boards', {
    method: 'POST',
    body: { title, category, author, imageUrl },
  });
}

// DELETE /boards/:id
export function deleteBoard(id) {
  return request(`/boards/${id}`, { method: 'DELETE' });
}

// --- Cards ------------------------------------------------------------------

// GET /boards/:id/cards
export function getCards(boardId) {
  return request(`/boards/${boardId}/cards`);
}

// POST /cards
export function createCard({ message, gifUrl, author, boardId }) {
  return request('/cards', {
    method: 'POST',
    body: { message, gifUrl, author, boardId: Number(boardId) },
  });
}

// PATCH /cards/:id/upvote
export function upvoteCard(id) {
  return request(`/cards/${id}/upvote`, { method: 'PATCH' });
}

// PATCH /cards/:id/pin  (stretch: pinned cards)
export function pinCard(id) {
  return request(`/cards/${id}/pin`, { method: 'PATCH' });
}

// DELETE /cards/:id
export function deleteCard(id) {
  return request(`/cards/${id}`, { method: 'DELETE' });
}

// --- Comments (stretch) -----------------------------------------------------

// GET /cards/:id/comments
export function getComments(cardId) {
  return request(`/cards/${cardId}/comments`);
}

// POST /cards/:id/comments
export function addComment(cardId, { content, author }) {
  return request(`/cards/${cardId}/comments`, {
    method: 'POST',
    body: { content, author },
  });
}

// --- Auth (stretch) ---------------------------------------------------------

// POST /auth/signup -> { token, user }
export function signup({ username, password }) {
  return request('/auth/signup', {
    method: 'POST',
    body: { username, password },
    auth: false,
  });
}

// POST /auth/login -> { token, user }
export function login({ username, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: { username, password },
    auth: false,
  });
}

// GET /auth/me -> public user (used to restore a session from a stored token)
export function getMe() {
  return request('/auth/me');
}
