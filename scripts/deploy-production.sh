#!/bin/bash

# Production Deployment Script
set -e

echo "🚀 Starting deployment to production environment..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Authenticate with Railway (if not already authenticated)
if ! railway whoami &> /dev/null; then
    echo "❌ Not authenticated with Railway."
    echo ""
    echo "To set up Railway authentication:"
    echo "1. Run: railway login"
    echo "2. Follow the browser authentication flow"
    echo "3. Re-run this script"
    echo ""
    echo "For GitHub Actions, ensure these secrets are set:"
    echo "- RAILWAY_TOKEN (get with: railway auth)"
    echo "- RAILWAY_SERVICE_ID (get with: railway status)"
    echo "- PRODUCTION_URL (from Railway dashboard)"
    exit 1
fi

echo "✅ Railway CLI authenticated"

# Confirm production deployment
echo "⚠️  You are about to deploy to PRODUCTION!"
read -p "Are you sure you want to continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Production deployment cancelled"
    exit 1
fi

# Run comprehensive pre-deployment checks
echo "🔍 Running comprehensive pre-deployment checks..."

# Lint check
echo "  - Running lint..."
npm run lint

# Type check
echo "  - Running type check..."
npm run type-check

# Security audit
echo "  - Running security audit..."
npm audit --audit-level high

# Build
echo "  - Building application..."
npm run build

# Run tests with coverage
echo "  - Running tests with coverage..."
npm run test:coverage

echo "✅ All pre-deployment checks passed"

# Deploy to production
echo "🚀 Deploying to Railway production environment..."
railway deploy --environment production

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 60

# Run comprehensive post-deployment checks
echo "🏥 Running comprehensive health checks..."
PRODUCTION_URL=$(railway domain --environment production 2>/dev/null || echo "")

if [ -n "$PRODUCTION_URL" ]; then
    echo "  - Testing health endpoint..."
    if curl -f "$PRODUCTION_URL/health" > /dev/null 2>&1; then
        echo "    ✅ Health check passed!"
    else
        echo "    ❌ Health check failed!"
        exit 1
    fi

    echo "  - Testing readiness endpoint..."
    if curl -f "$PRODUCTION_URL/readyz" > /dev/null 2>&1; then
        echo "    ✅ Readiness check passed!"
    else
        echo "    ❌ Readiness check failed!"
        exit 1
    fi

    echo "  - Testing liveness endpoint..."
    if curl -f "$PRODUCTION_URL/livez" > /dev/null 2>&1; then
        echo "    ✅ Liveness check passed!"
    else
        echo "    ❌ Liveness check failed!"
        exit 1
    fi

    echo "  - Testing GraphQL endpoint..."
    if curl -X POST -H "Content-Type: application/json" -d '{"query":"query{__typename}"}' -f "$PRODUCTION_URL/graphql" > /dev/null 2>&1; then
        echo "    ✅ GraphQL endpoint responsive!"
    else
        echo "    ❌ GraphQL endpoint not responding!"
        exit 1
    fi
else
    echo "⚠️ Could not determine production URL, skipping health checks"
fi

echo "🎉 Production deployment completed successfully!"
echo "📝 Check the Railway dashboard for deployment details"
echo "🔍 Monitor logs and metrics for any issues"