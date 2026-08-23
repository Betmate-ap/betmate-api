# BetMate API

GraphQL API for the BetMate platform — Express v5 + Apollo Server 4 + Prisma v6 + PostgreSQL, deployed on Railway.

> **For the full technical reference** (architecture, data model, service logic, bet lifecycle, cricket sync, error codes): see **[docs/BACKEND.md](docs/BACKEND.md)**

---

## Quick Start (Staging)

The staging API is live at:

```
https://betmate-api-staging-staging.up.railway.app/graphql
```

Import the Postman collection (`postman/betmate-api.postman_collection.json`) and point it at the staging URL to test everything without running anything locally.

---

## Local Development

### Prerequisites (one-time)

- [Node.js](https://nodejs.org) (v20+)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) — for the local PostgreSQL container
- A GitHub PAT with `read:packages` scope — needed to install `@betmate-ap/contracts` from GitHub Packages

### First-time setup

```bash
# 1. Install dependencies (requires NODE_AUTH_TOKEN in your shell env for GitHub Packages)
NODE_AUTH_TOKEN=<your_github_pat> npm install

# 2. Create your local env file
cp .env.example .env
# The defaults already match docker-compose — no edits needed for local dev

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

## Environment Variables

Copy `.env.example` to `.env`. For local dev the defaults work out of the box.

| Variable                | Required | Default                 | Description                                                                |
| ----------------------- | -------- | ----------------------- | -------------------------------------------------------------------------- |
| `DATABASE_URL`          | Yes      | —                       | PostgreSQL connection string                                               |
| `JWT_SECRET`            | Yes      | —                       | Secret for signing JWTs (use a strong random value in staging/prod)        |
| `NODE_AUTH_TOKEN`       | Yes      | —                       | GitHub PAT for installing `@betmate-ap/contracts` from GitHub Packages     |
| `PORT`                  | No       | `4000`                  | Server port                                                                |
| `NODE_ENV`              | No       | `development`           | `development` / `staging` / `production`                                   |
| `CORS_ORIGIN`           | No       | `http://localhost:5173` | Allowed frontend origin                                                    |
| `COOKIE_SECURE`         | No       | —                       | Set `true` in production to require HTTPS for cookies                      |
| `COOKIE_SAMESITE`       | No       | —                       | Cookie SameSite policy (`lax`, `strict`, `none`)                           |
| `SENTRY_DSN`            | No       | —                       | Sentry DSN for error tracking                                              |
| `CRICKET_API_KEY`       | No\*     | —                       | Cricket data API key. \*Required in staging/production for live match sync |
| `CRICKET_IPL_SERIES_ID` | No\*     | —                       | IPL series ID from the cricket data API. \*Required in staging/production  |

> In `development`, cricket sync uses a mock provider — `CRICKET_API_KEY` and `CRICKET_IPL_SERIES_ID` are not needed.

---

## Postman Collection

The collection covers the full happy path and key edge cases.

1. Open Postman → **Import** → select `postman/betmate-api.postman_collection.json`
2. Set the `baseUrl` variable to `http://localhost:4000` (local) or the staging URL
3. Run requests in order — test scripts automatically capture tokens and IDs between requests

The "Get Upcoming Matches" request always picks the match furthest from now, so it stays clear of the 2-hour challenge window during normal testing.

---

## Scripts

### Development

```bash
npm run dev            # Start dev server with hot reload (runs prisma generate first)
npm run dev:setup      # First-time setup: prisma generate + migrate dev
npm run build          # Compile TypeScript
npm run start          # Start production server (runs migrations first via prestart)
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

## Health Endpoints

| Endpoint               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `GET /health`          | Returns `ok`                                           |
| `GET /healthz`         | Returns `ok` (Railway liveness probe)                  |
| `GET /livez`           | Returns `alive`                                        |
| `GET /readyz`          | Checks database connection — 200 ready / 503 not ready |
| `GET /health/detailed` | DB latency, memory usage, system info                  |

---

## Project Structure

```
src/
├── index.ts              # Entry point
├── app.ts                # Express + Apollo setup, middleware, health routes
├── constants/            # Shared constants (bet rules, IPL teams)
├── graphql/
│   ├── context.ts        # Context type + requireAuth()
│   ├── loadSchema.ts     # Loads SDL from @betmate-ap/contracts
│   └── resolvers/        # Domain resolvers: auth, friend, match, bet
├── lib/                  # Config, auth, logger, Prisma client, scheduler
├── services/
│   ├── auth/             # AuthService, ProfileService
│   ├── bet/              # ChallengeService, StatsService, ResolutionService
│   ├── friend/           # FriendService, BlockService
│   ├── match/            # MatchService
│   └── cricket/          # CricketSyncService, MockProvider, CricketDataProvider
└── utils/                # CryptoUtils (hash, JWT)

prisma/
└── schema.prisma         # Database schema

postman/                  # Postman collection
docs/
└── BACKEND.md            # Full technical documentation
```

---

## Deployment

Railway deploys automatically from `main` to the staging environment. Migrations run automatically via the `prestart` script — no manual steps needed.

Required Railway environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_AUTH_TOKEN`, `NODE_ENV`, `CORS_ORIGIN`.

See [docs/BACKEND.md → Deployment](docs/BACKEND.md#13-deployment) for the full environment variable reference and Railway configuration details.
