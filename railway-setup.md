# Railway Setup Instructions

## Initial Authentication Setup

1. **Login to Railway:**
   ```bash
   railway login
   ```
   This will open a browser for authentication.

2. **Navigate to API directory and link project:**
   ```bash
   cd betmate-api
   railway link
   ```

3. **Create staging and production environments:**
   ```bash
   railway environment create staging
   railway environment create production
   ```

## Environment Variables Setup

Set these environment variables in Railway dashboard for each environment:

### Staging Environment
- `NODE_ENV=staging`
- `DATABASE_URL` (Staging database)
- `JWT_SECRET`
- `CORS_ORIGIN`
- `SENTRY_DSN`

### Production Environment
- `NODE_ENV=production`
- `DATABASE_URL` (Production database)
- `JWT_SECRET`
- `CORS_ORIGIN`
- `SENTRY_DSN`

## Deployment Commands

### Deploy to Staging
```bash
railway deploy --environment staging
```

### Deploy to Production
```bash
railway deploy --environment production
```