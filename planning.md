# Kudos Board — Project Specification (planning.md)

> This is the source of truth for the system. Every implementation decision in
> Milestones 1–3 implements against this document. If the code diverges, update
> this file **first**, then change the code. The goal at submission is
> **code-spec parity**: this spec describes what the system actually does.

**Stack:** React 19 + Vite (frontend) · Express + Prisma + PostgreSQL (backend) · GIPHY API for gifs.

**Stretch features (Milestone 3):** User Accounts (JWT auth + bcrypt), Comments,
Dark Mode, and Pinned Cards. Spec additions for these are folded into each section
below and marked *(stretch: …)*.

---

## Section 1: Component Architecture

### Parent–child hierarchy

```
App                          (routing + global board/theme state)
├── Header                   (title / logo, links home)
├── Banner                   (hero image + tagline)
├── HomePage                 (route "/")
│   ├── SearchBar            (search input + submit + clear)
│   ├── BoardFilter          (All / Recent / Celebration / Thank you / Inspiration)
│   ├── CreateBoardButton    (opens CreateBoardModal)
│   ├── BoardGrid
│   │   └── BoardCard*       (one per board: image, title, view, delete)
│   └── CreateBoardModal     (form: title, category, author, image)
├── BoardPage                (route "/boards/:boardId")
│   ├── CreateCardButton     (opens CreateCardModal)
│   ├── CardGrid
│   │   └── Card*            (message, gif, upvotes, upvote btn, delete btn)
│   └── CreateCardModal      (form: message, gif via GIPHY search, author)
└── Footer                   (attribution)
```
`*` = rendered once per item in a list.

### Component table

| Component | Responsibility | Renders | Props (from where) | State | Interactions |
|---|---|---|---|---|---|
| **App** | Root; owns routing and shared board list + theme | `<Header>`, `<Banner>`, routed page, `<Footer>` | — | `boards`, `theme` (stretch) | route changes |
| **Header** | Site title, link home | `<header>`, logo, nav link | — | none | click logo → home |
| **Banner** | Hero image + tagline | `<div>` with image/text | none | none | none |
| **Footer** | Attribution | `<footer>` | none | none | none |
| **HomePage** | Dashboard: list, filter, search, create, delete boards | SearchBar, BoardFilter, CreateBoardButton, BoardGrid, CreateBoardModal | — | `boards`, `filter`, `searchQuery`, `isCreateOpen`, `loading`, `error` | filter, search, open modal, delete |
| **SearchBar** | Search boards by title | `<form>`, text `<input>`, submit btn, clear btn | `query`, `onSearch(q)`, `onClear()` (HomePage) | local `input` value | type, submit (Enter/click), clear |
| **BoardFilter** | Choose active category | buttons or `<select>` | `active`, `onChange(category)` (HomePage) | none | click category |
| **CreateBoardButton** | Trigger create-board modal | `<button>` | `onClick` (HomePage) | none | click |
| **BoardGrid** | Lay out boards in a grid | `<div class=grid>`, maps `BoardCard` | `boards`, `onDelete(id)` (HomePage) | none | none |
| **BoardCard** | Show one board, navigate, delete | `<div>`, image, title, View link, Delete btn | `board`, `onDelete(id)` (BoardGrid) | none | click View → `/boards/:id`; click Delete |
| **CreateBoardModal** | Form to create a board | `<form>`: title, category, author, image inputs | `isOpen`, `onClose()`, `onCreate(board)` (HomePage) | controlled fields, `formError` | type, submit, cancel |
| **BoardPage** | One board + its cards; add cards | CreateCardButton, CardGrid, CreateCardModal | `boardId` (route param) | `board`, `cards`, `isCreateOpen`, `loading`, `error` | open modal, upvote, delete |
| **CreateCardButton** | Trigger create-card modal | `<button>` | `onClick` (BoardPage) | none | click |
| **CardGrid** | Lay out cards in a grid | `<div class=grid>`, maps `Card` | `cards`, `onUpvote(id)`, `onDelete(id)` (BoardPage) | none | none |
| **Card** | Show one card; upvote; delete | `<div>`, message, gif, upvote count + btn, delete btn | `card`, `onUpvote(id)`, `onDelete(id)` (CardGrid) | none | click upvote; click delete |
| **CreateCardModal** | Form to create a card | `<Modal>` wrapping `<form>`: message, GIPHY search + pick, author | `isOpen`, `onClose()`, `onCreate(card)` (BoardPage) | controlled fields, `gifQuery`, `gifResults`, `selectedGif`, `manualUrl`, `searching`, `submitting`, `formError` | type, search gif, pick gif, submit, cancel |
| **Modal** *(new, M1)* | Reusable overlay shell (backdrop, close btn, Escape) | `<div class=modal-backdrop>` → `<div class=modal>` + children | `isOpen`, `onClose()`, `title`, `children` (the two create modals) | none | backdrop click / Escape / close btn → `onClose` |
| **ThemeToggle** *(stretch: dark mode)* | Switch light/dark theme | `<button>` inside `Header` | reads `ThemeContext` | none (context) | click → `toggleTheme()` |
| **AuthModal** *(stretch: auth)* | Login / Signup form in a modal | `<Modal>` + `<form>` (username, password, mode switch) | `isOpen`, `onClose()` (Header) | `mode`, `username`, `password`, `formError`, `submitting` | submit → context `login`/`signup`; toggle login↔signup |
| **CommentModal** *(stretch: comments)* | View a card + its comments; add a comment | `<Modal>`: card message/gif/author, comment list, add-comment form | `isOpen`, `onClose()`, `card` (BoardPage) | `comments`, `content`, `author`, `loading`, `formError` | submit comment → POST then refresh list |

> **Note (updated M1):** Routing uses `react-router-dom` v7 (installed in
> Milestone 1). Routes: `/` → `HomePage` (with `Banner`), `/boards/:boardId` →
> `BoardPage`. `Header`/`Footer` are persistent around the routed page in `App`.
>
> **New shared component (M1): `Modal`.** Not in the original spec — extracted as a
> reusable overlay shell (backdrop, close button, Escape-to-close) wrapped by both
> `CreateBoardModal` and `CreateCardModal`. See Decisions Log.
>
> **Milestone 1 data layer:** Since the backend doesn't exist until Milestone 2, the
> frontend talks to a mock API module (`src/api/client.js`) that mirrors the
> Section 2 contracts exactly but is backed by `localStorage`. In Milestone 3 the
> bodies are swapped for `fetch` calls and the components stay unchanged. GIPHY
> search lives in `src/api/giphy.js` (needs `VITE_GIPHY_API_KEY`; falls back to a
> manual gif-URL input when no key is set).
>
> **Stretch context providers (M3):** `AuthProvider` (`src/context/AuthContext.jsx`)
> owns `user`/`token`, exposes `login/signup/logout`, and restores the session from a
> stored JWT on load (via `GET /auth/me`). `ThemeProvider`
> (`src/context/ThemeContext.jsx`) owns `theme`, persists it to localStorage, and
> sets `data-theme` on `<html>`. Both wrap `<App>` in `main.jsx` (inside
> `BrowserRouter`). `Header` gains a `ThemeToggle` and the auth UI (Login/Signup when
> logged out; username + Logout when logged in). `Card` gains Pin and Comments
> buttons; `BoardFilter` gains a "Mine" option (visible only when logged in);
> `BoardCard` hides Delete on boards the current user doesn't own.

---

## Section 2: API Contracts

Base URL (dev): `http://localhost:3000`. All bodies are JSON. CORS enabled in Milestone 3.

### Boards

#### `GET /boards`
Returns all boards. Supports optional query params for filter/search.
- **Query params (optional):** `category` (`celebration` | `thank-you` | `inspiration`), `recent=true` (6 most recent), `search` (substring match on title, case-insensitive).
- **Success:** `200 OK` → `[ { id, title, category, author, imageUrl, createdAt } ]`
- **Errors:** `500` on database failure.

#### `POST /boards`
Create a board.
- **Request body:**
  | field | type | required |
  |---|---|---|
  | `title` | string | ✅ |
  | `category` | string | ✅ (one of: celebration, thank-you, inspiration) |
  | `author` | string | optional |
  | `imageUrl` | string | optional (default placeholder if omitted) |
- **Success:** `201 Created` → the created board object.
- **Errors:** `400` if `title` or `category` missing/invalid; `500` on db failure.

#### `GET /boards/:id`
Get one board (without cards).
- **Success:** `200 OK` → board object.
- **Errors:** `404` if no board with that id; `500`.

#### `DELETE /boards/:id`
Delete a board (and cascade-delete its cards).
- **Success:** `200 OK` → `{ message: "Board deleted" }` (or `204 No Content`).
- **Errors:** `404` if not found; `500`.

### Cards

#### `GET /boards/:id/cards`
Get all cards for a board.
- **Success:** `200 OK` → `[ { id, message, gifUrl, author, upvotes, boardId, createdAt } ]`
- **Errors:** `404` if board not found; `500`.

#### `POST /cards`  *(or `POST /boards/:id/cards`)*
Create a card on a board.
- **Request body:**
  | field | type | required |
  |---|---|---|
  | `message` | string | ✅ |
  | `gifUrl` | string | ✅ (selected via GIPHY) |
  | `author` | string | optional |
  | `boardId` | int | ✅ (if not in URL path) |
- **Success:** `201 Created` → the created card (`upvotes` defaults to 0).
- **Errors:** `400` if `message`, `gifUrl`, or `boardId` missing; `404` if board not found; `500`.

#### `PATCH /cards/:id/upvote`
Increment a card's upvote count by 1.
- **Request body:** none.
- **Success:** `200 OK` → updated card with new `upvotes`.
- **Errors:** `404` if card not found; `500`.

#### `DELETE /cards/:id`
Delete a card.
- **Success:** `200 OK` → `{ message: "Card deleted" }` (or `204`).
- **Errors:** `404` if not found; `500`.

> **Filtering & search live on `GET /boards`** via query params (above). Frontend
> may instead filter/search client-side; if so, note that change here at impl time.

### Stretch endpoints (Milestone 3 stretch features)

#### Auth *(user accounts)*
- **`POST /auth/signup`** — body `{ username (string, required), password (string, required) }`.
  Success `201` → `{ token, user: { id, username, createdAt } }`. Errors: `400` missing
  fields; `409` username already taken.
- **`POST /auth/login`** — body `{ username, password }`. Success `200` → `{ token, user }`.
  Errors: `400` missing fields; `401` invalid credentials.
- **`GET /auth/me`** — header `Authorization: Bearer <token>`. Success `200` →
  `{ id, username, createdAt }`. Errors: `401` missing/invalid token.

  Auth uses a JWT bearer token signed with `JWT_SECRET`. The password is bcrypt-hashed;
  `passwordHash` is never included in any response.

#### Ownership & "my boards"
- **`GET /boards?mine=true`** — with a valid bearer token, returns only the current
  user's boards. `401` if `mine=true` without a token.
- **`POST /boards` / `POST /cards` / `POST /boards/:id/cards`** — accept an optional
  bearer token; when present, the created board/card is associated with that user
  (`userId`). Anonymous creation (no token) is still allowed. Response objects gain a
  nullable `userId`.
- **`DELETE /boards/:id`** — if the board has an owner (`userId` set), only that user may
  delete it (`403` otherwise). Guest boards (`userId` null) remain deletable by anyone.

#### Pinned cards
- **`PATCH /cards/:id/pin`** — toggles a card's pinned state. Body: none. Success `200` →
  updated card (`pinned` flipped; `pinnedAt` = now when pinning, null when unpinning).
  Errors: `404` if not found. `GET /boards/:id/cards` returns pinned cards first
  (most-recently-pinned first), then unpinned by `createdAt` desc.

#### Comments
- **`GET /cards/:id/comments`** — success `200` →
  `[ { id, content, author, createdAt, cardId, userId } ]`. `404` if card not found.
- **`POST /cards/:id/comments`** — body `{ content (string, required), author (string, optional) }`;
  optional bearer token associates the comment with a user. Success `201` → created comment.
  Errors: `400` if `content` missing; `404` if card not found.

> Card response objects now also include `pinned` (bool), `pinnedAt` (datetime|null),
> and `userId` (int|null) in every cards endpoint.

---

## Section 3: Database Schema Spec

Two models. `Board` has many `Card`s; deleting a board cascades to its cards.

### Board
| field | type | required | notes |
|---|---|---|---|
| `id` | Int | ✅ | `@id @default(autoincrement())` |
| `title` | String | ✅ | |
| `category` | String | ✅ | celebration / thank-you / inspiration |
| `author` | String | optional | `String?` |
| `imageUrl` | String | optional | `String?`; placeholder default in app |
| `createdAt` | DateTime | ✅ | `@default(now())` — used for "Recent" filter |
| `cards` | Card[] | — | relation (one-to-many) |

### Card
| field | type | required | notes |
|---|---|---|---|
| `id` | Int | ✅ | `@id @default(autoincrement())` |
| `message` | String | ✅ | |
| `gifUrl` | String | ✅ | from GIPHY |
| `author` | String | optional | `String?` |
| `upvotes` | Int | ✅ | `@default(0)` |
| `createdAt` | DateTime | ✅ | `@default(now())` |
| `boardId` | Int | ✅ | foreign key |
| `board` | Board | — | `@relation(fields: [boardId], references: [id], onDelete: Cascade)` |

**Relationship:** `Board (1) ──< (many) Card`. `onDelete: Cascade` so deleting a board removes its cards.

### Stretch additions (Milestone 3 stretch features)

#### User *(auth)*
| field | type | required | notes |
|---|---|---|---|
| `id` | Int | ✅ | `@id @default(autoincrement())` |
| `username` | String | ✅ | `@unique` |
| `passwordHash` | String | ✅ | bcrypt hash — never returned by the API |
| `createdAt` | DateTime | ✅ | `@default(now())` |
| `boards` / `cards` / `comments` | relations | — | content this user created |

#### Comment *(comments)*
| field | type | required | notes |
|---|---|---|---|
| `id` | Int | ✅ | `@id @default(autoincrement())` |
| `content` | String | ✅ | comment body |
| `author` | String | optional | `String?` — free-text author when not logged in |
| `createdAt` | DateTime | ✅ | `@default(now())` |
| `cardId` | Int | ✅ | FK → Card, `onDelete: Cascade` |
| `userId` | Int | optional | `Int?` FK → User, `onDelete: SetNull` (null for guests) |

#### Board — added fields
| field | type | required | notes |
|---|---|---|---|
| `userId` | Int | optional | `Int?` FK → User; null = guest/anonymous board (for owner-only delete) |

#### Card — added fields
| field | type | required | notes |
|---|---|---|---|
| `pinned` | Boolean | ✅ | `@default(false)` — pinned-to-top state |
| `pinnedAt` | DateTime | optional | `DateTime?` — when pinned; orders pinned cards (most recent first) |
| `userId` | Int | optional | `Int?` FK → User; null = guest card |
| `comments` | Comment[] | — | one-to-many; cascade-deletes with the card |

**New relationships:** `User (1) ──< (many) Board / Card / Comment` (all
`onDelete: SetNull` so deleting a user leaves their content as guest content);
`Card (1) ──< (many) Comment` (`onDelete: Cascade`).

---

## Section 4: State Architecture

| State variable | Type / initial | Owner | Updated when |
|---|---|---|---|
| `boards` | `Board[]` / `[]` | HomePage (or App) | on mount (GET /boards); after create/delete board |
| `filter` | string / `"all"` | HomePage | user clicks a category in BoardFilter |
| `searchQuery` | string / `""` | HomePage | user submits search; cleared → `""` shows all |
| `isCreateOpen` (board) | bool / `false` | HomePage | CreateBoardButton click (open) / modal close |
| `board` | `Board \| null` / `null` | BoardPage | on mount (GET /boards/:id) |
| `cards` | `Card[]` / `[]` | BoardPage | on mount; after create/delete/upvote card |
| `isCreateOpen` (card) | bool / `false` | BoardPage | CreateCardButton click / modal close |
| `selectedGif` | string / `""` | CreateCardModal | user picks a gif from GIPHY results |
| `gifResults` | array / `[]` | CreateCardModal | GIPHY search returns results |
| `gifQuery` | string / `""` | CreateCardModal | user types in the GIPHY search box |
| `manualUrl` *(M1)* | string / `""` | CreateCardModal | gif-URL fallback typed when no GIPHY key |
| `submitting` *(M1)* | bool / `false` | Create*Modal | true while the async create call is in flight |
| `loading` | bool / `false` | HomePage, BoardPage | before/after each fetch |
| `error` | string / `""` | HomePage, BoardPage | a fetch fails |
| `user` *(stretch: auth)* | `User \| null` / `null` | AuthContext | login/signup success; logout; session restore on load |
| `token` *(stretch: auth)* | `string \| null` / from localStorage | AuthContext | login/signup; cleared on logout |
| `authLoading` *(stretch: auth)* | bool / `true` | AuthContext | while restoring the session via `GET /auth/me` |
| `isAuthOpen` *(stretch: auth)* | bool / `false` | Header | Login/Signup click (open) / modal close |
| `theme` *(stretch: dark mode)* | `"light"`/`"dark"` / localStorage→`"light"` | ThemeContext | ThemeToggle click; persisted, sets `data-theme` on `<html>` |
| `commentCard` *(stretch: comments)* | `Card \| null` / `null` | BoardPage | Comments button click / modal close |
| `comments` *(stretch: comments)* | `Comment[]` / `[]` | CommentModal | on open (GET comments); after POST a comment |

**Data flow:** State lives in the page that owns the data (HomePage owns `boards`,
BoardPage owns `cards`). Children receive data via props and report user actions
upward via callback props (`onCreate`, `onDelete`, `onUpvote`). After a mutating
API call succeeds, the owner re-fetches or updates state locally so the UI updates
without a manual refresh.

---

## Decisions Log — Frontend (Milestone 1)
- **Component that diverged most from the original spec**: `CreateBoardModal` /
  `CreateCardModal` — both originally specced as standalone modal components.
  **What I changed**: Extracted a shared `Modal` component (overlay, backdrop-click
  + Escape to close, header/close button) so the two forms only own their fields and
  validation, not duplicated overlay markup. The two create-modal components now
  render their forms *inside* `<Modal>`. Added `Modal` to the component hierarchy.
- **State variable I needed that wasn't in the original spec**: `submitting` (a
  boolean) in both `CreateBoardModal` and `CreateCardModal`, plus `manualUrl` in
  `CreateCardModal` (gif-URL fallback when no GIPHY key is configured).
  **Which component owns it**: the respective modal components. `submitting`
  disables the submit button and shows "Creating…/Adding…" while the async create
  call resolves; this wasn't anticipated at spec time but is needed to prevent
  double-submits.
- **Prop that didn't match the API response shape and required adjustment**: none
  yet — components consume the documented field names (`imageUrl`, `gifUrl`,
  `upvotes`, `createdAt`) directly, because the Milestone 1 mock client
  (`src/api/client.js`) returns exactly the Section 2 response shapes. The real
  test of this comes in Milestone 3 when the Express backend is wired in.

**Other intentional notes (M1):**
- **Board image is optional**, with a category-based placeholder applied when the
  field is left blank (honoring the Section 2 `POST /boards` contract:
  `imageUrl` optional, default placeholder). The Milestone 1 feature list phrases
  image as "required"; the spec is the source of truth here, so it stays optional
  with a sensible default rather than blocking board creation.
- **Filtering & search use `GET /boards` query params** (`category`, `recent`,
  `search`) per the spec, handled in the mock client — not client-side array
  filtering. HomePage rebuilds the query and re-fetches when `filter`/`searchQuery`
  change, so the Milestone 3 swap to a real backend needs no frontend logic change.
- **Real-time updates**: after a successful create/delete/upvote, the owning page
  updates its `boards`/`cards` state locally (and HomePage re-fetches to respect the
  active filter), so the UI updates with no manual refresh.

## Spec Reconciliation — Backend (Milestone 2)
Backend implemented in `backend/` (Express 5 + Prisma 6 + PostgreSQL). All routes
smoke-tested with curl (22/22 checks pass: success cases, validation 400s, 404s,
and cascade delete). Server entry: `backend/index.js`; routes in `backend/routes/`;
validation in `backend/middleware/validate.js`; schema in `backend/prisma/schema.prisma`.

### Endpoints verified
- `GET /boards` — ✅ matches spec. Supports `?category=`, `?recent=true` (take 6,
  ordered by `createdAt desc`), and `?search=` (case-insensitive `contains` on title).
- `POST /boards` — ✅ matches spec. 201 + created board; 400 if `title`/`category`
  missing or `category` not in {celebration, thank-you, inspiration}; omitted
  `imageUrl` gets a placeholder default.
- `GET /boards/:id` — ✅ matches spec. 200 board; 404 if not found (incl. non-numeric id).
- `DELETE /boards/:id` — ✅ matches spec. 200 `{ message: "Board deleted" }`; 404 if
  not found. Cards cascade-delete via the schema relation (verified).
- `GET /boards/:id/cards` — ✅ matches spec. 200 array; 404 if board not found.
- `POST /cards` — ✅ matches spec. 201 + card (`upvotes` defaults to 0); 400 if
  `message`/`gifUrl`/`boardId` missing; 404 if board not found.
- `PATCH /cards/:id/upvote` — ✅ matches spec. 200 updated card; increments by 1;
  multiple upvotes allowed (verified count 0→3); 404 if card not found.
- `DELETE /cards/:id` — ✅ matches spec. 200 `{ message: "Card deleted" }`; 404 if
  not found.

### Schema verified against spec
- Board model fields match planning.md schema spec: ✅ `id, title, category, author?,
  imageUrl?, createdAt, cards[]` — exact match.
- Card model fields match planning.md schema spec: ✅ `id, message, gifUrl, author?,
  upvotes (@default 0), createdAt, boardId, board` — exact match.
- Relationship (Board → Cards) correct: ✅ one-to-many with `onDelete: Cascade`
  (cascade verified by deleting a board with cards and confirming the cards are gone).

### Gaps found and resolved
- None. Implementation matches the contracts as written.

### Intentional spec updates made during backend implementation
- **Both card-create routes implemented.** The contract listed `POST /cards`
  *(or `POST /boards/:id/cards`)`. I implemented **both**: `POST /cards` takes
  `boardId` in the body; `POST /boards/:id/cards` takes it from the URL path.
  Frontend (Milestone 3) can use whichever is cleaner — `POST /cards` with
  `boardId` is the primary one to integrate against.
- **Default board image.** `imageUrl` is optional; when omitted, the server stores
  `https://placehold.co/600x400?text=Kudos+Board` so the grid always has an image.
- **Tooling note (not a contract change).** `npm install prisma` now pulls Prisma 7
  (new generator + `prisma.config.ts`). I pinned **Prisma 6** for the conventional
  `@prisma/client` import and `env("DATABASE_URL")` schema that the spec and CodePath
  tutorials assume. Teammates: run `npm install` in `backend/` to get the pinned version.
- **Error shape.** All error responses are JSON `{ "error": "<message>" }` with the
  status codes above; unhandled DB failures return `500 { "error": "Internal server error" }`.

## Final Spec Reconciliation — Full Pipeline (Milestone 3)

The Milestone 1 localStorage mock (`src/api/client.js`) was replaced with real
`fetch` calls to the Express backend. Because the mock mirrored the Section 2
contracts exactly, the consuming components (HomePage, BoardPage, the modals) needed
no logic changes for the core features — only the client's function bodies changed.
Verified end-to-end with both servers running (backend smoke test 26/26; full-pipeline
integration test 8/8, including pinned-card ordering and the comment round-trip).
Frontend `npm run lint` and `npm run build` both pass clean.

### Frontend fetch calls verified against API contracts
- `GET /boards` (home page load): ✅ request/response match spec. Filter/search/mine
  map to `?category`, `?recent=true`, `?search`, `?mine=true`.
- `POST /boards` (create board): ✅ sends `{ title, category, author, imageUrl }`;
  optional bearer token associates the owner. 201 + board (now includes `userId`).
- `DELETE /boards/:id`: ✅ matches. Owner-only enforced server-side (401/403); the UI
  also hides Delete on boards the current user doesn't own.
- `GET /boards/:id/cards`: ✅ matches; cards returned pinned-first, then newest.
- `POST /cards`: ✅ sends `{ message, gifUrl, author, boardId }`; 201 + card.
- `PATCH /cards/:id/upvote`: ✅ matches; 200 + updated card.
- `DELETE /cards/:id`: ✅ matches; 200 + `{ message }`.
- **Stretch** `PATCH /cards/:id/pin`: ✅ 200 + updated card (`pinned`/`pinnedAt`).
- **Stretch** `GET|POST /cards/:id/comments`: ✅ list/create verified.
- **Stretch** `POST /auth/signup|login`, `GET /auth/me`: ✅ token stored in
  localStorage; session restored on load via `/auth/me`.

### Integration gaps found and resolved
- **Stale frontend `node_modules`.** This machine's `node_modules` predated the
  Milestone-1 addition of `react-router-dom`, so `npm run build` failed to resolve it.
  Resolved by running `npm install` in `frontend/` (no code change). Teammates pulling
  this branch should do the same.
- **Pin reorder needs a re-fetch.** Pinning changes sort order (pinned-first, newest-
  pin-first), which a local state swap can't reproduce. `BoardPage.handlePin` re-fetches
  the board's cards after `PATCH /pin` so the grid order always matches the backend.
- No contract mismatches: field names (`imageUrl`, `gifUrl`, `upvotes`, `userId`,
  `pinned`, `pinnedAt`) are identical across the frontend, the contracts, and the
  Prisma schema.

### State architecture verified
- ✅ Section 4 matches the implementation. New state added this milestone is documented
  there: `user`/`authLoading` (AuthContext), `theme` (ThemeContext), `isAuthOpen`
  (Header), `commentCard` (BoardPage), `comments` (CommentModal). Auth/theme moved into
  React Context (rather than App-local state) so Header, pages, and modals can all read
  them — an intentional refinement of the "owned by App" note in the original spec.

### Final code-spec parity assessment
- ✅ Yes — `planning.md` accurately describes the system as built. All four required
  feature areas plus four stretch features (User Accounts, Comments, Dark Mode, Pinned
  Cards) are implemented and reflected in Sections 1–4.

## Decisions Log — Stretch Features (Milestone 3)
- **Auth approach**: JWT (signed with `JWT_SECRET`) + bcrypt password hashing
  (`bcryptjs`). Token stored in `localStorage` and sent as `Authorization: Bearer`.
  `optionalAuth` middleware lets boards/cards/comments be created anonymously (guest
  content has `userId = null`) while still associating content when logged in — this
  satisfies "anonymous cards still allowed."
- **Owner-only delete**: enforced server-side (owned board → 401 without a token, 403
  for a non-owner) AND in the UI (Delete hidden unless `board.userId` is null or matches
  the current user). Guest boards (`userId` null) remain deletable by anyone.
- **Dark mode**: implemented via CSS custom properties. `ThemeContext` sets
  `data-theme="dark"` on `<html>`; a single `:root[data-theme="dark"]` block overrides
  the color variables, so every existing component themed automatically. Persisted to
  localStorage; defaults to light on first visit. Dark palette chosen for ≥4.5:1 contrast.
- **Pinned cards**: `pinned` (bool) + `pinnedAt` (datetime) on Card. Ordering is done by
  the backend (`pinned desc, pinnedAt desc, createdAt desc`) so "most recent pin first"
  is authoritative; the board page re-fetches after a pin toggle to reflect it.
- **Comments**: separate `Comment` model (cascade-deletes with its card). Viewed/added
  in a `CommentModal` reusing the shared `Modal`. Logged-in users comment under their
  username; guests may supply a free-text author.
- **New components** (added to Section 1): `ThemeToggle`, `AuthModal`, `CommentModal`;
  **new context providers**: `AuthProvider`, `ThemeProvider` (wrap `<App>` in `main.jsx`).
