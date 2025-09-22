# Betmate API

GraphQL API server for the Betmate platform with Railway deployment support.

## 🚀 Quick Start

### Development Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Setup environment:**

   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:4000/graphql`

## 🚨 Railway Deployment Setup

If you're seeing "Project Token not found" errors, you need to configure Railway secrets.

### Quick Fix

1. **Get Railway token:**

   ```bash
   # Get token from Railway Dashboard: https://railway.app/account/tokens
   # OR use browserless login: railway login --browserless
   railway auth
   ```

2. **Add to GitHub:**
   - Go to your repo → Settings → Secrets and variables → Actions
   - Add `RAILWAY_TOKEN` secret with the token from step 1

3. **Re-run deployment**

📖 **Full guide:** [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

## 📦 Available Scripts

### Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
```

### Testing

```bash
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
```

### Code Quality

```bash
npm run lint             # Lint code
npm run format           # Format code
npm run type-check       # TypeScript type checking
```

### Database

```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate:staging    # Run migrations on staging
npm run db:migrate:production # Run migrations on production
```

### Deployment

```bash
npm run deploy:staging   # Deploy to staging
npm run deploy:production # Deploy to production
```

## 🌍 Environments

- **Development:** `http://localhost:4000`
- **Staging:** Auto-deployed from `main` branch
- **Production:** Manual deployment workflow

## 🏥 Health Checks

- `GET /health` - Basic health check
- `GET /healthz` - Kubernetes-style health check
- `GET /readyz` - Database readiness check
- `GET /livez` - Liveness check
- `GET /health/detailed` - Comprehensive health with metrics

## 🔧 Configuration

### Environment Variables

Copy `.env.template` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/betmate_dev

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Railway Environment Variables

Set these in your Railway dashboard:

- `NODE_ENV`
- `DATABASE_URL` (provided by Railway)
- `JWT_SECRET`
- `CORS_ORIGIN`
- `SENTRY_DSN` (optional)

## 🚀 Deployment

### Automatic Deployment

- **Staging:** Deploys automatically when you push to `main` branch
- **Production:** Use the "Deploy to Production" workflow (manual trigger)

### Manual Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## 🔍 Troubleshooting

### Common Issues

1. **"Project Token not found"**
   - See [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)

2. **Database connection issues**
   - Check your `DATABASE_URL` environment variable
   - Run `npm run db:generate`

3. **Build failures**
   - Run `npm run type-check` to check for TypeScript errors
   - Run `npm run lint` to check for linting issues

### Debug Commands

```bash
# Check Railway authentication
railway whoami

# Check project status
railway status

# View logs
railway logs --environment staging
```

## 📁 Project Structure

```
src/
├── app.ts              # Express app configuration
├── index.ts            # Application entry point
├── graphql/            # GraphQL schema and resolvers
├── lib/                # Utilities and configuration
├── test/               # Test utilities and setup
└── scripts/            # Deployment and utility scripts
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Create a pull request

## 📄 License

[Your License Here]
