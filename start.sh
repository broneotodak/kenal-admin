#!/bin/bash

echo "🚀 Starting Kenal Admin Dashboard..."
echo ""
echo "📋 Login Credentials:"
echo "   Email: neo@todak.com"
echo "   Password: password"
echo ""
echo "🌐 Opening in browser..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
npm run dev &

# Wait a bit for server to start
sleep 3

# Open in browser (works on macOS)
open http://localhost:3000 || open http://localhost:3001 || open http://localhost:3002

echo ""
echo "✅ Kenal Admin is running!"
echo "   If browser didn't open, visit: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"