#!/bin/bash
echo "Starting build process..."

echo "Installing backend dependencies..."
cd backend
npm install
npm rebuild better-sqlite3

echo "Installing frontend dependencies and building..."
cd ../frontend
npm install
npm run build

echo "Build complete!"
