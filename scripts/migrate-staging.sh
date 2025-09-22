#!/bin/bash

# Database Migration Script for Staging
set -e

echo "🗄️ Running database migrations for staging environment..."

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

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Deploy migrations to staging database
echo "🚀 Deploying migrations to staging database..."
railway run --environment staging npx prisma migrate deploy

# Check database status
echo "🔍 Checking database status..."
railway run --environment staging npx prisma migrate status

echo "✅ Staging database migrations completed successfully!"
echo "📝 Check Railway dashboard for database logs if needed"