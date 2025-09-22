# Deployment Guide

This guide covers all deployment scenarios for the Betmate project.

## 🚀 Deployment Overview

We use Railway for hosting with automated deployments via GitHub Actions:

- **Staging**: Auto-deploys from `develop` branch
- **Production**: Auto-deploys from `main` branch

## 📋 Prerequisites

### Required Tools
- [Railway CLI](https://docs.railway.app/cli/installation)
- [GitHub CLI](https://cli.github.com/) (optional)
- Node.js 18+

### Railway Setup

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link your project:**
   ```bash
   cd betmate-api
   railway link
   ```

## 🔧 Environment Configuration

### Required Environment Variables

Set these in your Railway dashboard for each environment:

#### Staging Environment
```bash
NODE_ENV=staging
DATABASE_URL=${DATABASE_URL}  # Provided by Railway
JWT_SECRET=your-staging-jwt-secret
CORS_ORIGIN=https://your-staging-frontend.railway.app
SENTRY_DSN=your-sentry-dsn
COOKIE_SECRET=your-staging-cookie-secret
LOG_LEVEL=info
```

#### Production Environment
```bash
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}  # Provided by Railway
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-production-domain.com
SENTRY_DSN=your-sentry-dsn
COOKIE_SECRET=your-production-cookie-secret
LOG_LEVEL=warn
```

### Setting Environment Variables

Via Railway Dashboard:
1. Go to your Railway project
2. Select the environment (staging/production)
3. Go to Variables tab
4. Add each environment variable

Via Railway CLI:
```bash
# Set staging variables
railway variables set JWT_SECRET=your-secret --environment staging

# Set production variables
railway variables set JWT_SECRET=your-secret --environment production
```

## 🤖 Automated Deployment (Recommended)

### GitHub Actions Setup

The project includes GitHub Actions workflows for automated deployment:

- `.github/workflows/ci.yml` - Runs tests and checks on all PRs
- `.github/workflows/deploy-staging.yml` - Deploys to staging on `develop` branch
- `.github/workflows/deploy-production.yml` - Deploys to production on `main` branch

### Required GitHub Secrets

Set these in your GitHub repository settings:

```bash
RAILWAY_TOKEN              # Your Railway API token
RAILWAY_SERVICE_ID          # Your Railway service ID
STAGING_URL                 # Your staging environment URL
PRODUCTION_URL              # Your production environment URL
```

### Getting Railway Credentials

1. **Railway Token:**
   ```bash
   railway auth
   # Copy the token from the output
   ```

2. **Service ID:**
   ```bash
   railway status
   # Copy the service ID from the output
   ```

### Deployment Workflow

1. **Feature Development:**
   ```bash
   git checkout -b feature/your-feature
   # Make changes
   git commit -m "feat: your feature"
   git push origin feature/your-feature
   # Create PR to develop
   ```

2. **Staging Deployment:**
   - Merge PR to `develop` branch
   - GitHub Actions automatically deploys to staging
   - Test on staging environment

3. **Production Deployment:**
   - Create PR from `develop` to `main`
   - After review and approval, merge to `main`
   - GitHub Actions automatically deploys to production

## 🛠️ Manual Deployment

### Staging Deployment

```bash
# Run deployment script
npm run deploy:staging

# Or manual steps:
railway login
cd betmate-api
npm run build
railway deploy --environment staging
```

### Production Deployment

```bash
# Run deployment script (includes safety checks)
npm run deploy:production

# Or manual steps:
railway login
cd betmate-api
npm run test
npm run build
railway deploy --environment production
```

## 🗄️ Database Migrations

### Automated Migrations

Migrations run automatically on deployment via the `prestart` script in package.json.

### Manual Migration Commands

```bash
# Staging database
npm run db:migrate:staging

# Production database (with safety prompts)
npm run db:migrate:production

# Check migration status
railway run --environment production npx prisma migrate status
```

### Migration Best Practices

1. **Always test migrations on staging first**
2. **Backup production database before major migrations**
3. **Use backwards-compatible migrations when possible**
4. **Monitor application logs after migration deployment**

## 🏥 Health Checks & Monitoring

### Health Check Endpoints

- `GET /health` - Basic health check
- `GET /healthz` - Kubernetes-style health
- `GET /readyz` - Readiness (includes database)
- `GET /livez` - Liveness check
- `GET /health/detailed` - Comprehensive health with metrics

### Post-Deployment Verification

```bash
# Basic health check
curl https://your-app.railway.app/health

# Detailed health check
curl https://your-app.railway.app/health/detailed

# Test GraphQL endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"query":"query{__typename}"}' \
  https://your-app.railway.app/graphql
```

### Railway Monitoring

Railway provides built-in monitoring:
- Application logs
- Metrics dashboard
- Resource usage
- Deployment history

Access via: https://railway.app/project/your-project-id

## 🚨 Troubleshooting

### Common Deployment Issues

1. **Railway authentication failed:**
   ```bash
   railway logout
   railway login
   ```

2. **Environment variables not set:**
   ```bash
   railway variables
   # Check if all required variables are present
   ```

3. **Database connection issues:**
   ```bash
   railway run --environment staging npx prisma db push
   ```

4. **Build failures:**
   ```bash
   # Check build logs in Railway dashboard
   # Or run locally:
   npm run build
   ```

### Debug Commands

```bash
# Check deployment status
railway status

# View live logs
railway logs --environment production

# Connect to database
railway connect --environment production

# Run command in Railway environment
railway run --environment production npm run test
```

### Rollback Strategy

If deployment fails:

1. **Quick rollback via Railway:**
   - Go to Railway dashboard
   - Navigate to Deployments
   - Click "Redeploy" on the last working version

2. **Git-based rollback:**
   ```bash
   # Revert last commit and redeploy
   git revert HEAD
   git push origin main
   ```

## 🔒 Security Considerations

### Deployment Security

- Never commit secrets to Git
- Use Railway's environment variables
- Rotate secrets regularly
- Monitor access logs
- Use HTTPS only in production

### Production Checklist

Before production deployment:

- [ ] All tests pass
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Monitoring configured
- [ ] SSL/TLS certificates valid
- [ ] CORS origins configured
- [ ] Rate limiting enabled

## 📊 Performance Optimization

### Railway Configuration

- **Scaling**: Configure auto-scaling in Railway dashboard
- **Resources**: Monitor and adjust CPU/memory allocation
- **Regions**: Choose optimal deployment region

### Database Optimization

- Connection pooling configured
- Query optimization enabled
- Regular performance monitoring
- Backup strategy implemented

## 📞 Support

### Railway Support
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

### Project Support
- Check GitHub Issues
- Review deployment logs in Railway dashboard
- Contact development team

## 🔄 Maintenance

### Regular Tasks

1. **Weekly:**
   - Review application logs
   - Check performance metrics
   - Monitor resource usage

2. **Monthly:**
   - Update dependencies
   - Rotate secrets if needed
   - Review and clean up old deployments

3. **Quarterly:**
   - Security audit
   - Performance review
   - Backup testing
   - Disaster recovery testing