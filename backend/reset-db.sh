#!/bin/bash

echo "🗄️  PulseLedger Database Reset"
echo "=============================="

# Check if we're in the backend directory
if [ ! -f "index.js" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Stop any running backend processes
echo "🛑 Stopping backend processes..."
pkill -f "node.*backend" 2>/dev/null || true
echo "✅ Backend processes stopped"

# Remove database file
if [ -f "database.sqlite" ]; then
    echo "🗑️  Removing existing database..."
    rm database.sqlite
    echo "✅ Database removed"
fi

# Initialize database
echo ""
echo "🗄️  Initializing new database..."
node utils/initDb.js
echo "✅ Database initialized"

echo ""
echo "🎉 Database reset completed!"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin123 (from .env file)"
echo ""
echo "📝 Note: All data has been cleared and reset to defaults." 