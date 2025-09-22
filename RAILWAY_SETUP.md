# Railway Deployment Setup Guide

This guide will help you set up Railway deployment with GitHub Actions for your Betmate project.

## 🚀 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install the Railway CLI
3. **GitHub Repository**: With admin access to configure secrets

## 📋 Step-by-Step Setup

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login to Railway

```bash
railway login
```

This will open a browser window for authentication.

### 3. Get Your Railway Token

After logging in, get your Railway token:

```bash
railway auth
```

Copy the token that appears - you'll need this for GitHub secrets.

### 4. Link Your Project to Railway

Navigate to your project directory and link it:

```bash
cd betmate-api
railway link
```

Choose your Railway project or create a new one.

### 5. Get Your Service ID

```bash
railway status
```

Copy the Service ID from the output.

### 6. Create Railway Environments

Create staging and production environments:

```bash
railway environment create staging
railway environment create production
```

### 7. Configure GitHub Repository Secrets

Go to your GitHub repository settings and add these secrets:

#### Required Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `RAILWAY_TOKEN` | Your Railway API token | Run `railway auth` |
| `RAILWAY_SERVICE_ID` | Your Railway service ID | Run `railway status` |
| `STAGING_URL` | Your staging environment URL | From Railway dashboard |
| `PRODUCTION_URL` | Your production environment URL | From Railway dashboard |

#### How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value

### 8. Configure Environment Variables in Railway

Set these environment variables in your Railway dashboard for each environment:

#### Staging Environment
```bash
NODE_ENV=staging
JWT_SECRET=your-staging-jwt-secret
CORS_ORIGIN=https://your-staging-frontend.railway.app
SENTRY_DSN=your-sentry-dsn
COOKIE_SECRET=your-staging-cookie-secret
LOG_LEVEL=info
```

#### Production Environment
```bash
NODE_ENV=production
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=https://your-production-domain.com
SENTRY_DSN=your-sentry-dsn
COOKIE_SECRET=your-production-cookie-secret
LOG_LEVEL=warn
```

### 9. Test the Setup

#### Manual Deployment Test

```bash
# Test staging deployment
cd betmate-api
railway deploy --environment staging

# Test production deployment
railway deploy --environment production
```

#### GitHub Actions Test

1. Push to `develop` branch to trigger staging deployment
2. Push to `main` branch to trigger production deployment

## 🔧 Troubleshooting

### Common Issues

#### 1. "Project Token not found"
- **Cause**: Missing or incorrect `RAILWAY_TOKEN` secret
- **Solution**: Re-run `railway auth` and update the GitHub secret

#### 2. "Service not found"
- **Cause**: Missing or incorrect `RAILWAY_SERVICE_ID` secret
- **Solution**: Run `railway status` and update the GitHub secret

#### 3. "Environment not found"
- **Cause**: Environment doesn't exist in Railway
- **Solution**: Create the environment with `railway environment create <name>`

#### 4. "Authentication failed"
- **Cause**: Expired or invalid Railway token
- **Solution**: Re-authenticate with `railway login` and get a new token

### Debug Commands

```bash
# Check current authentication
railway whoami

# List environments
railway environment list

# Check project status
railway status

# View logs
railway logs --environment staging
```

## 🔄 Deployment Workflow

### Automated Deployment

- **Staging**: Automatically deploys when you push to `develop` branch
- **Production**: Automatically deploys when you push to `main` branch

### Manual Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

## 🏥 Health Checks

After deployment, the GitHub Actions will automatically test these endpoints:

- `GET /health` - Basic health check
- `GET /healthz` - Kubernetes-style health check
- `GET /readyz` - Database readiness check
- `GET /livez` - Liveness check

## 📞 Support

### Railway Support
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

### Project Issues
- Check the GitHub Actions logs for detailed error messages
- Review Railway deployment logs in the Railway dashboard
- Ensure all secrets are correctly configured

## ✅ Verification Checklist

- [ ] Railway CLI installed and authenticated
- [ ] Project linked to Railway
- [ ] GitHub secrets configured:
  - [ ] `RAILWAY_TOKEN`
  - [ ] `RAILWAY_SERVICE_ID`
  - [ ] `STAGING_URL`
  - [ ] `PRODUCTION_URL`
- [ ] Railway environments created (staging, production)
- [ ] Environment variables set in Railway dashboard
- [ ] Test deployment successful
- [ ] GitHub Actions workflow passing

Once all items are checked, your Railway deployment pipeline is ready! 🚀