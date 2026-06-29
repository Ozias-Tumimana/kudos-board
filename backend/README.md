# Backend — Kudos Board API

Express + Prisma + PostgreSQL API. Implements the API Contracts and Database
Schema Spec in [`../planning.md`](../planning.md) (Sections 2 & 3).

## Stack
- **Express 5** — HTTP server / routing
- **Prisma 6** — ORM + migrations (`@prisma/client`)
- **PostgreSQL** — database

## Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create the database** (once). Any local Postgres works. Example:
   ```bash
   createdb kudos_board
   ```

3. **Configure `.env`** — copy the example and set your connection string:
   ```bash
   cp .env.example .env
   # edit DATABASE_URL to match your local Postgres
   ```

4. **Run migrations** (creates the `Board` and `Card` tables + generates the client):
   ```bash
   npx prisma migrate dev
   ```

5. **Start the server**
   ```bash
   npm run dev    # nodemon (auto-reload)
   # or
   npm start      # plain node
   ```
   The API listens on `http://localhost:3000` (override with `PORT` in `.env`).

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/boards` | List boards. Query params: `category`, `recent=true`, `search`. |
| `POST` | `/boards` | Create a board (`title`, `category` required). |
| `GET` | `/boards/:id` | Get one board. |
| `DELETE` | `/boards/:id` | Delete a board (cascades to its cards). |
| `GET` | `/boards/:id/cards` | List a board's cards. |
| `POST` | `/boards/:id/cards` | Create a card on a board (boardId from path). |
| `POST` | `/cards` | Create a card (boardId in body). |
| `PATCH` | `/cards/:id/upvote` | Increment a card's upvote count by 1. |
| `DELETE` | `/cards/:id` | Delete a card. |

See `../planning.md` Section 2 for full request/response/error contracts.

## Project layout
```
backend/
├── index.js              # Express entry point: middleware + route mounting + error handler
├── prismaClient.js       # shared PrismaClient instance
├── middleware/
│   └── validate.js       # request-body validation (validateBoard, validateCard)
├── routes/
│   ├── boards.js         # /boards routes + nested /boards/:id/cards
│   └── cards.js          # /cards routes (create, upvote, delete)
└── prisma/
    ├── schema.prisma     # Board + Card models (Database Schema Spec)
    └── migrations/       # version-controlled migration history
```

## Testing
Smoke-test with curl, Postman, or Insomnia against the table above. The server
returns JSON for every response, including errors (`{ "error": "..." }`).
