# Betmate — Project Notes (Private)

> This file is **not** in Git. It’s my single source of truth across all repos.
> Start of session: ask Claude to read this file.  
> End of session: ask Claude to append to **Daily log** and update checkboxes in **Next steps**.

## Scope & repos
- Goal: production‑ready app with strong CI/CD, security, and automation before feature coding.
- Repos:
  - `betmate-api` — Node.js (TS) GraphQL API: Express + Apollo, Prisma + Postgres.
  - `betmate-contracts` — GraphQL schema + generated TS types (source of truth).

## Status (what’s already done)
### Contracts
- GraphQL schema in `src/schema`.
- Codegen to `generated/` via `codegen.ts`.
- TypeScript, ESLint (flat) + Prettier.
- Husky + lint-staged + commitlint (Conventional Commits).
- GitHub: Dependabot, CodeQL, PR template, CODEOWNERS.
- Release: publish to GitHub Packages with provenance.

### API
- Express + Apollo wired; `/graphql`, `/healthz`.
- Security: helmet (CSP prod), rate-limit, cookie-parser, CORS (env), trust proxy.
- Logging: pino + request `x-request-id`.
- GraphQL: schema from contracts; resolvers scaffold; complexity limit 250; introspection dev-only.
- Auth foundation: JWT-from-cookie parsed to context.
- Prisma wired to Postgres; `prisma generate` on build.
- Config: validated env (port, cors origin, jwt secret, db url).
- Docker local: `betmate_db` + `betmate_api`.
- ESLint + Prettier; Husky + lint-staged + commitlint.
- GitHub: protected `main`, Dependabot, CodeQL, PR template, CODEOWNERS.
- Release: Docker image to GHCR on tags (provenance).

## How to run (quick)
### Contracts
- `npm ci && npm run build`
### API
- `.env` required (see repo README)
- `npm ci && npm run build && node dist/index.js`
- or `docker compose up --build`

## Next steps (checklist)
- [x] API: multi‑stage prod Dockerfile (non‑root, slimmer image).
- [x] API: readiness/liveness endpoints (k8s-friendly).
- [x] Prisma: User model + migrations + real resolvers.
- [x] 3-tier deployment setup: Railway configs + GitHub Actions.
- [x] Environment-specific configs (.env.staging, .env.production).
- [x] Basic error monitoring with Sentry integration.
- [x] Set up Railway staging environment with custom domain.
- [x] Database migrations and Prisma client working.
- [x] **URGENT: Fix Railway CLI authentication for GitHub Actions.**
- [x] **URGENT: Merge Prisma client Docker fix PR.**
- [ ] Configure GitHub secrets and branch protection.
- [ ] Set up production Railway project.
- [ ] Contracts: README for consumers (importing types).
- [ ] Public READMEs polished (local dev, scripts, CI).
- [ ] Create `betmate-web` (React+Vite+TS) with same lint/format/commit hooks.
- [ ] Dev compose: db + api + web together.
- [ ] Auth: Google sign‑in path → cookie JWT.

## Daily log
### 2025‑08‑15
- Notes file created; repos green with hooks and security middleware; local Docker verified.

### 2025‑08‑24
- Added Prisma User model with email, googleId for auth, timestamps.
- Created initial migration (20250824010000_init_users).
- Updated GraphQL schema with email + createdAt fields.
- Connected resolvers to real Prisma data (no more placeholders).
- Secured Dockerfile: multi-stage, non-root user (nextjs:nodejs).
- Added k8s-ready health endpoints: /readyz (db check), /livez (app health).
- **3-Tier Deployment Infrastructure:**
  - Railway config for Docker deployments
  - GitHub Actions: staging (main branch) + production (manual)
  - Environment-specific configs (.env.staging/.production)
  - Sentry error monitoring integration
- **Railway Staging Environment:**
  - Successfully deployed to Railway with custom domain: betmate-stg.apatil.net
  - URLs working: /healthz, /readyz, /livez, /graphql
  - Database connected and migrations applied
- **Deployment Fixes Completed:**
  - Fixed Railway CLI authentication for GitHub Actions (PR #20)
  - Fixed Prisma client Docker issue - copied .prisma/client to production image (PR #17)
  - Both fixes merged to main branch - deployments should now work

### 2025‑09‑22
- Reviewed project status and resolved deployment blockers
- Confirmed Railway CLI authentication fix is implemented via PR #20
- Confirmed Prisma client Docker fix is implemented via PR #17
- Both urgent deployment issues resolved - ready for next development phase

## Handy commands
- Contracts: `npm run build`, `npm run lint:fix`, `npm run format:fix`
- API: `npm run build && node dist/index.js`, `npm run docker:up`, `npm run lint`, `npm run format`
