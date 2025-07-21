#!/bin/bash

echo "🔄 PulseLedger Project Reset Script"
echo "=================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're in the right directory
if [ ! -f "start-dev.sh" ]; then
    echo "❌ Error: Please run this script from the PulseLedger root directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Stop any running processes
echo "🛑 Stopping any running processes..."
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "vite.*frontend" 2>/dev/null || true
echo "✅ Processes stopped"

# Clean up backend
echo ""
echo "🧹 Cleaning backend..."
cd backend

# Remove database file
if [ -f "database.sqlite" ]; then
    echo "🗑️  Removing existing database..."
    rm database.sqlite
    echo "✅ Database removed"
fi

# Remove node_modules and reinstall
if [ -d "node_modules" ]; then
    echo "🗑️  Removing node_modules..."
    rm -rf node_modules
    echo "✅ node_modules removed"
fi

# Remove package-lock.json
if [ -f "package-lock.json" ]; then
    echo "🗑️  Removing package-lock.json..."
    rm package-lock.json
    echo "✅ package-lock.json removed"
fi

# Reinstall backend dependencies
echo "📦 Installing backend dependencies..."
npm install
echo "✅ Backend dependencies installed"

# Initialize database
echo ""
echo "🗄️  Initializing database..."
node utils/initDb.js
echo "✅ Database initialized"

cd ..

# Clean up frontend
echo ""
echo "🧹 Cleaning frontend..."
cd frontend

# Remove node_modules and reinstall
if [ -d "node_modules" ]; then
    echo "🗑️  Removing node_modules..."
    rm -rf node_modules
    echo "✅ node_modules removed"
fi

# Remove package-lock.json
if [ -f "package-lock.json" ]; then
    echo "🗑️  Removing package-lock.json..."
    rm package-lock.json
    echo "✅ package-lock.json removed"
fi

# Reinstall frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
echo "✅ Frontend dependencies installed"

cd ..

echo ""
echo "🎉 Project reset completed successfully!"
echo ""
echo "📋 Summary:"
echo "   ✅ Database reset and initialized"
echo "   ✅ Backend dependencies reinstalled"
echo "   ✅ Frontend dependencies reinstalled"
echo "   ✅ Default admin user created"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123 (from .env file)"
echo ""
echo "🚀 To start the project:"
echo "   ./start-dev.sh"
echo ""
echo "📝 Note: The database has been completely reset. All data has been cleared." 