# Betmate

A comprehensive betting management platform built with modern technologies and industry-standard practices.

## 🏗️ Architecture

```
betmate/
├── betmate-api/          # GraphQL API Server
├── betmate-contracts/    # Shared TypeScript contracts
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Railway CLI (for deployment)

### Development Setup

1. **Clone and setup the project:**
   ```bash
   git clone <repository-url>
   cd betmate
   ```

2. **Setup API development environment:**
   ```bash
   cd betmate-api
   npm run setup:dev
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:4000/graphql`

## 📦 Project Structure

### API (`betmate-api/`)

```
src/
├── app.ts              # Express app configuration
├── index.ts            # Application entry point
├── graphql/            # GraphQL schema and resolvers
├── lib/                # Utilities and configuration
│   ├── auth.ts         # Authentication logic
│   ├── config.ts       # Configuration management
│   ├── logger.ts       # Structured logging
│   ├── monitoring.ts   # Performance monitoring
│   ├── prisma.ts       # Database client
│   └── sentry.ts       # Error tracking
├── test/               # Test utilities and setup
└── scripts/            # Deployment and utility scripts
```

## 🛠️ Available Commands

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run setup:dev        # Setup development environment
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
npm run lint:fix         # Fix linting issues
npm run format           # Check code formatting
npm run format:fix       # Fix code formatting
npm run type-check       # TypeScript type checking
```

### Database
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate:staging    # Run migrations on staging
npm run db:migrate:production # Run migrations on production
npm run db:reset:dev     # Reset development database
```

### Deployment
```bash
npm run deploy:staging   # Deploy to staging
npm run deploy:production # Deploy to production
```

## 🌍 Environments

### Development
- **URL**: `http://localhost:4000`
- **Database**: Local PostgreSQL
- **Logging**: Pretty-printed to console
- **GraphQL Playground**: Enabled

### Staging
- **URL**: Provided by Railway
- **Database**: Railway PostgreSQL
- **Logging**: JSON structured
- **Monitoring**: Basic health checks

### Production
- **URL**: Provided by Railway
- **Database**: Railway PostgreSQL
- **Logging**: JSON structured with redaction
- **Monitoring**: Comprehensive health checks
- **Security**: Enhanced rate limiting

## 🔒 Security

- JWT-based authentication
- Rate limiting (100 req/15min for GraphQL)
- Helmet.js security headers
- Input validation and sanitization
- Secrets redaction in logs
- Security audit in CI/CD

## 📊 Monitoring & Health Checks

### Health Endpoints

- `GET /health` - Basic health check
- `GET /healthz` - Kubernetes-style health check
- `GET /readyz` - Readiness check (includes DB)
- `GET /livez` - Liveness check
- `GET /health/detailed` - Comprehensive health with metrics

### Logging

- Structured JSON logging in production
- Pretty-printed logs in development
- Request correlation IDs
- Automatic PII redaction
- Performance metrics tracking

## 🚀 Deployment

### Automated Deployment (Recommended)

Deployments are automated via GitHub Actions:

- **Staging**: Deploys automatically on push to `develop` branch
- **Production**: Deploys automatically on push to `main` branch

### Manual Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### Railway Setup

1. **Login to Railway:**
   ```bash
   railway login
   ```

2. **Link project:**
   ```bash
   cd betmate-api
   railway link
   ```

3. **Set environment variables** in Railway dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `SENTRY_DSN`

## 🔧 Environment Variables

Copy `.env.template` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/betmate_dev

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# CORS
CORS_ORIGIN=http://localhost:5173

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## 🧪 Testing

- **Unit Tests**: Jest with TypeScript
- **Integration Tests**: Supertest for API endpoints
- **Database Tests**: In-memory test database
- **Coverage**: Comprehensive coverage reporting

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🤝 Contributing

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and test:**
   ```bash
   npm run lint
   npm run type-check
   npm test
   ```

3. **Commit using conventional commits:**
   ```bash
   git commit -m "feat: add new feature"
   ```

4. **Push and create a PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📝 API Documentation

### GraphQL Endpoint

- **URL**: `/graphql`
- **Playground**: Available in development at `http://localhost:4000/graphql`

### REST Endpoints

- `GET /health` - Health check
- `GET /readyz` - Readiness check
- `GET /livez` - Liveness check
- `GET /health/detailed` - Detailed health with metrics

## 🔍 Troubleshooting

### Common Issues

1. **Database connection issues:**
   ```bash
   # Check database status
   npm run db:generate
   ```

2. **Migration issues:**
   ```bash
   # Reset development database
   npm run db:reset:dev
   ```

3. **Railway deployment issues:**
   ```bash
   # Check authentication
   railway whoami

   # Re-authenticate if needed
   railway login
   ```

### Debug Logs

Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 📈 Performance

- Automatic performance monitoring
- GraphQL complexity analysis
- Database query optimization
- Memory usage tracking
- Response time monitoring

## 🆘 Support

- Check the [Issues](https://github.com/your-org/betmate/issues) page
- Review [Project Notes](./project-notes.md)
- Contact the development team

## 📄 License

[Your License Here]