# BetMate API

GraphQL API for the BetMate platform — Express v5 + Apollo Server v5 + Prisma v6 + PostgreSQL, deployed on Railway.

---

## Local Development

### Prerequisites (one-time)

- [Node.js](https://nodejs.org) (v20+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (for the local PostgreSQL container)

### First-time setup after cloning

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file (credentials already match docker-compose — no edits needed)
cp .env.example .env

# 3. Start the database container
docker compose up db -d

# 4. Generate Prisma client and run migrations
npm run dev:setup

# 5. Start the API with hot reload
npm run dev
```

API is available at `http://localhost:4000/graphql`

### Daily use

```bash
docker compose up db -d   # if the container isn't already running
npm run dev
```

### After pulling schema changes

If `prisma/schema.prisma` changed in a pull:

```bash
npm run dev:setup   # re-runs generate + migrate
npm run dev
```

---

## Scripts

### Development

```bash
npm run dev            # Start dev server with hot reload (runs prisma generate first)
npm run dev:setup      # First-time setup: prisma generate + migrate dev
npm run build          # Compile TypeScript
npm run start          # Start production server (runs migrations first via prestart)
```

### Testing

```bash
npm test               # Run tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

### Code Quality

```bash
npm run lint           # ESLint
npm run lint:fix       # ESLint with auto-fix
npm run format         # Prettier check
npm run format:fix     # Prettier write
npm run type-check     # TypeScript type check only
```

### Database

```bash
npm run db:generate          # Generate Prisma client
npm run db:migrate:deploy    # Apply pending migrations (non-interactive, used in production)
```

---

## Environment Variables

Copy `.env.example` to `.env`. For local dev the defaults work out of the box with `docker compose up db -d`.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | Server port (default: 4000) |
| `NODE_ENV` | No | `development` / `staging` / `production` |
| `CORS_ORIGIN` | No | Allowed frontend origin (default: `http://localhost:5173`) |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

---

## Health Endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Returns `ok` |
| `GET /healthz` | Returns `ok` (Railway probe) |
| `GET /livez` | Returns `alive` |
| `GET /readyz` | Checks database connection — 200 ready / 503 not ready |
| `GET /health/detailed` | DB status, memory usage, system info |

---

## Deployment

Railway deploys automatically from `main`. Staging environment:
`https://betmate-api-staging-staging.up.railway.app`

Required Railway environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_AUTH_TOKEN`, `NODE_ENV`, `CORS_ORIGIN`.

---

## Project Structure

```
src/
├── index.ts          # Entry point
├── app.ts            # Express + Apollo setup
├── graphql/          # Schema loader and resolvers
├── lib/              # Config, auth, logger, Prisma client
├── services/         # Business logic (AuthService)
└── utils/            # Helpers

prisma/
└── schema.prisma     # Database schema

postman/              # Postman collection and environment files
```

---

## GraphQL API

Schema is defined in the `betmate-contracts` package (`@betmate-ap/contracts`).

**Queries:** `health`, `me`

**Mutations:** `signup`, `login`, `logout`, `refreshToken`, `sendVerificationEmail`, `verifyEmail`, `forgotPassword`, `resetPassword`

Import `postman/betmate-api.postman_collection.json` into Postman to test all endpoints with automated token capture.
