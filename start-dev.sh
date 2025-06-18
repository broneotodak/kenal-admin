#!/bin/bash

echo "🚀 Starting Kenal Admin Dashboard..."
echo ""

# Clean any existing build cache
echo "🧹 Cleaning build cache..."
rm -rf .next

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Start development server
echo "✅ Starting development server..."
npm run dev
