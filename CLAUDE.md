# CLAUDE.md — Kudos Board

This file gives Claude (and teammates) the full context for this project so it's
available every session. **`planning.md` is the source of truth for the system;
this file is the source of truth for the assignment.**

## Project summary
Kudos Board — a full-stack app where users create themed boards and fill them with
cards (messages of praise/encouragement). First full-stack app built from scratch.

- **Frontend:** React 19 + Vite, in `frontend/`. Will add `react-router-dom`.
- **Backend:** Express + Prisma + PostgreSQL, in `backend/` (built in Milestone 2).
- **External API:** GIPHY (gif search/select inside the card form).
- **Repo:** https://github.com/Ozias-Tumimana/kudos-board
- **Due:** Thursday, July 2nd, 9:00 PM PDT.

## Working agreements
- **Spec-driven.** Build against `planning.md`. If code diverges from the spec,
  update `planning.md` **first**, then change code. Target = **code-spec parity**.
- **Git flow (team):** never commit directly to `main`. `git pull origin main`
  before branching → `git checkout -b feat/<task>` → commit small → push → open PR.
- **Avoid merge conflicts:** divide by ownership (frontend vs backend / by component),
  short-lived branches, pull `main` often. `planning.md` is edited by one person at a
  time — coordinate before editing it.
- **Secrets:** `.env` (incl. `DATABASE_URL`, GIPHY key) is git-ignored. Never commit it.
- **Styling:** timebox to ~1 hour; functionality first.

---

## Required Features

### Home Page
- **Display:** Header, Banner, Search bar, List of boards, Footer.
- **Display Boards:** grid view; each board shows an image/gif and a title.
- **Filter Boards:** All/Home, Recent (6 most recent), Celebration, Thank you,
  Inspiration. Clicking a category shows matching boards.
- **Search:** text input + submit button + clear; matches title substring on Enter
  or submit click; clearing all text shows all boards.
- **View Board:** click a board → navigate to that board's page.
- **Add New Board:** form with Title (required), Category (required), Author
  (optional). On success the board appears in the grid.
- **Delete Board:** removes it from the grid.

### Board Page
- **Display Cards:** grid of all cards for the board; each card shows message, gif,
  upvote count, delete button.
- **Add New Card:** message (required), gif via GIPHY search/select (required),
  author (optional). On success the card appears in the grid.
- **Upvote Card:** clicking upvote increases count by 1; can upvote multiple times.
- **Delete Card:** removes the card from the grid.

### Cross-cutting
- **Real-time updates:** UI updates on create/upvote/delete with no manual refresh.
- **Responsive:** works on desktop, tablet, mobile.

## Stretch Features (optional)
- **User Accounts** (login/signup, boards & cards tied to user, guest cards allowed,
  "my boards" filter, owner-only board delete).
- **Deployment** via Render (frontend + backend deployed separately).
- **Comments** on cards (text required, author optional; viewed in a modal).
- **Dark Mode** (toggle on Home + Board pages; persists across nav; defaults light;
  4.5:1 contrast).
- **Pinned Cards** (pin/unpin; pinned float to top ordered by most-recent pin;
  persists across nav + refresh).

> For any stretch feature: update `planning.md` (component, endpoint, schema, state)
> **before** implementing it.

---

## Milestones

### Milestone 0 — Project Setup
- Init git, `frontend/` + `backend/` dirs, open in Cursor, install tooling.
- Write `planning.md` with 4 sections: **Component Architecture, API Contracts,
  Database Schema Spec, State Architecture**.
- Review the spec with Claude (Ask mode, `@planning.md`), update what's useful.
- Commit `planning.md` before any implementation code.
- **Checkpoint:** repo has `frontend/` + `backend/` committed; `planning.md` has all
  4 sections and is committed.

### Milestone 1 — Frontend
- Build the React frontend using the component architecture as the guide.
- Dashboard (view/create/delete boards, filter by category), create-board form,
  board detail view, cards (create/upvote/delete), real-time updates, responsive.
- Add a **Decisions Log — Frontend** section to `planning.md`, then commit.
- **Checkpoint:** working dashboard, create/delete boards & cards, board detail view,
  dynamic updates, responsive, `planning.md` updated.

### Milestone 2 — Backend
- `npm init -y`; `npm install prisma -g`; `npm install express @prisma/client pg`;
  `npx prisma init`.
- Implement `schema.prisma` from the Database Schema Spec.
- Build Express server (`index.js`) implementing the API Contracts: boards CRUD,
  cards CRUD, add/get cards by board, error handling, request-validation middleware.
- Integrate Prisma client; store `DATABASE_URL` in `.env`; test routes in Postman/Insomnia.
- Add **Spec Reconciliation — Backend** section to `planning.md`, then commit.
- **Checkpoint:** Postgres + Prisma connected, migrations applied, all routes working
  & tested, error handling + validation, `planning.md` updated.

### Milestone 3 — Connect Frontend + Backend
- Run backend exposing the API; enable CORS (`npm install cors`; `app.use(cors())`).
- Frontend uses `fetch`/`axios` against the documented contracts; handle success,
  errors, and loading states.
- Add **Final Spec Reconciliation — Full Pipeline** section to `planning.md`, commit
  before submitting.
- **Checkpoint:** frontend + backend connected, data flows both ways, `planning.md`
  reflects the system as built (code-spec parity).

## Submission
Submit via the CodePath project page Submit button by **Thursday, July 2nd, 9:00 PM PDT**.
