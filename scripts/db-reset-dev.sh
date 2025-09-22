#!/bin/bash

# Development Database Reset Script
set -e

echo "🗄️ Resetting development database..."

# Confirm database reset
echo "⚠️  This will reset your development database and ALL DATA WILL BE LOST!"
read -p "Are you sure you want to continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Database reset cancelled"
    exit 1
fi

# Reset database
echo "🔄 Resetting database schema..."
npx prisma migrate reset --force

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed database (if seed script exists)
if grep -q "prisma.seed" package.json; then
    echo "🌱 Seeding database..."
    npm run db:seed
else
    echo "⚠️ No seed script found. Add 'db:seed' script to package.json if needed."
fi

echo "✅ Development database reset completed!"
echo "🔍 Your database is now clean and ready for development"