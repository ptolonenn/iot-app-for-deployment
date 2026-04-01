#!bin/bash
# Install backend dependencies
cd backend
npm Install
npm rebuild better-sqlite3

# Install and build frontend
cd ../frontend
npm Install
npm run build

echo "Build complete"
