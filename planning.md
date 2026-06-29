# Kudos Board — Project Specification (planning.md)

> This is the source of truth for the system. Every implementation decision in
> Milestones 1–3 implements against this document. If the code diverges, update
> this file **first**, then change the code. The goal at submission is
> **code-spec parity**: this spec describes what the system actually does.

**Stack:** React 19 + Vite (frontend) · Express + Prisma + PostgreSQL (backend) · GIPHY API for gifs.

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
| `theme` *(stretch)* | `"light"`/`"dark"` | App | dark-mode toggle; persisted to localStorage |

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
<!-- Fill in after building the backend. -->
### Endpoints verified
- `GET /boards` —
- `POST /boards` —
- `DELETE /boards/:id` —
- `GET /boards/:id/cards` —
- `POST /cards` —
- `PATCH /cards/:id/upvote` —
- `DELETE /cards/:id` —
### Schema verified against spec
- Board model fields match planning.md schema spec:
- Card model fields match planning.md schema spec:
- Relationship (Board → Cards) correct:
### Gaps found and resolved
### Intentional spec updates made during backend implementation

## Final Spec Reconciliation — Full Pipeline (Milestone 3)
<!-- Fill in after connecting frontend + backend. -->
### Frontend fetch calls verified against API contracts
- `GET /boards` (home page load):
- `POST /boards` (create board):
- `DELETE /boards/:id`:
- `GET /boards/:id/cards`:
- `POST /cards`:
- `PATCH /cards/:id/upvote`:
- `DELETE /cards/:id`:
### Integration gaps found and resolved
### State architecture verified
### Final code-spec parity assessment
