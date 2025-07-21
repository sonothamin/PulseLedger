#!/bin/bash

# PulseLedger Development Startup Script
echo "Starting PulseLedger Development Environment..."

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
pkill -f "nodemon index.js" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Use nvm if available
if command -v nvm &> /dev/null; then
    nvm use 20.19.0
fi
# Function to cleanup background processes on exit
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting backend server on port 3000..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "Starting frontend server on port 5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Development servers started!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait 
