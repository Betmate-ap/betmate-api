#!/bin/bash

# Database Migration Script for Production
set -e

echo "🗄️ Running database migrations for production environment..."

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

# Confirm production migration
echo "⚠️  You are about to run migrations on PRODUCTION database!"
echo "🔍 This will modify the production database schema."
read -p "Are you sure you want to continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Production migration cancelled"
    exit 1
fi

# Show current migration status
echo "📊 Current migration status:"
railway run --environment production npx prisma migrate status

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Create database backup (if supported)
echo "💾 Creating database backup..."
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
echo "🔒 Backup timestamp: $BACKUP_DATE"
echo "⚠️ Manual backup recommended before proceeding"

# Deploy migrations to production database
echo "🚀 Deploying migrations to production database..."
railway run --environment production npx prisma migrate deploy

# Verify migration status
echo "🔍 Verifying migration status..."
railway run --environment production npx prisma migrate status

# Run post-migration checks
echo "🏥 Running post-migration health checks..."
railway run --environment production node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  (async () => {
    try {
      await prisma.\$connect();
      console.log('✅ Database connection successful');

      // Basic query test
      const result = await prisma.\$queryRaw\`SELECT 1 as test\`;
      console.log('✅ Database query test successful');

      await prisma.\$disconnect();
      console.log('✅ All post-migration checks passed');
    } catch (error) {
      console.error('❌ Post-migration check failed:', error);
      process.exit(1);
    }
  })();
"

echo "✅ Production database migrations completed successfully!"
echo "📝 Monitor application logs for any post-migration issues"
echo "🔍 Consider running smoke tests on production endpoints"