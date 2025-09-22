#!/bin/bash

# Development Environment Setup Script
set -e

echo "🔧 Setting up development environment..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: $NODE_VERSION"

if [[ "$NODE_VERSION" < "v18" ]]; then
    echo "⚠️ Warning: Node.js v18+ is recommended"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.template .env
    echo "✏️ Please edit .env file with your configuration"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npx prisma generate

# Check database connection
echo "🔍 Checking database connection..."
if npx prisma db push --preview-feature --accept-data-loss 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
    echo "💡 Make sure your DATABASE_URL is correct in .env"
    echo "💡 For local development, you can use:"
    echo "   docker run --name postgres-dev -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=betmate_dev -p 5432:5432 -d postgres:15"
fi

# Install git hooks
echo "🪝 Setting up git hooks..."
npm run prepare

echo "🎉 Development environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Run 'npm run dev' to start the development server"
echo "  3. Visit http://localhost:4000/graphql for GraphQL playground"
echo ""
echo "🧪 Available commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run test         - Run tests"
echo "  npm run lint         - Lint code"
echo "  npm run format       - Format code"