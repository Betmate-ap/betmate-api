#!/bin/bash

# Staging Deployment Script
set -e

echo "🚀 Starting deployment to staging environment..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Authenticate with Railway (if not already authenticated)
if ! railway whoami &> /dev/null; then
    echo "❌ Not authenticated with Railway. Please run 'railway login' first."
    exit 1
fi

echo "✅ Railway CLI authenticated"

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Lint check
echo "  - Running lint..."
npm run lint

# Type check
echo "  - Running type check..."
npm run type-check

# Build
echo "  - Building application..."
npm run build

# Run tests
echo "  - Running tests..."
npm run test

echo "✅ All pre-deployment checks passed"

# Deploy to staging
echo "🚀 Deploying to Railway staging environment..."
railway deploy --environment staging

# Wait for deployment to be ready
echo "⏳ Waiting for deployment to be ready..."
sleep 30

# Run post-deployment health check
echo "🏥 Running health check..."
STAGING_URL=$(railway domain --environment staging 2>/dev/null || echo "")

if [ -n "$STAGING_URL" ]; then
    if curl -f "$STAGING_URL/health" > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed!"
        exit 1
    fi
else
    echo "⚠️ Could not determine staging URL, skipping health check"
fi

echo "🎉 Staging deployment completed successfully!"
echo "📝 Check the Railway dashboard for deployment details"