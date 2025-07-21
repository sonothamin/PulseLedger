# PulseLedger - Hospital Accounts Management System

A comprehensive hospital accounts management system with POS, sales tracking, expense management, and more.

## Project Structure

- `frontend/` - React + Vite frontend application
- `backend/` - Node.js + Express backend API

## Port Configuration

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## Setup Instructions

### Quick Start (Recommended)

1. Install dependencies for both frontend and backend:
   ```bash
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

2. Start both servers with the development script:
   ```bash
   ./start-dev.sh
   ```

This will start both servers automatically:
- Backend: http://localhost:3000
- Frontend: http://localhost:5173

### Manual Setup

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The backend will be available at http://localhost:3000

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173

## Features

- **POS System**: Point of sale with product management
- **Sales Tracking**: Complete sales history and reporting
- **Expense Management**: Track and categorize expenses
- **Patient Management**: Patient records and information
- **User Management**: Role-based access control
- **Multi-language Support**: English, Bengali, and Spanish
- **Branding**: Customizable hospital branding with logo upload
- **Invoice Generation**: Professional invoice printing
- **Real-time Updates**: WebSocket integration for live updates

## API Documentation

See `backend/API_DOCS.md` for detailed API documentation.

## Development

- Frontend uses Vite with proxy configuration to forward API calls to backend
- Backend uses Express with SQLite database
- Authentication via JWT tokens
- File uploads for hospital logos
- Real-time updates via WebSocket 