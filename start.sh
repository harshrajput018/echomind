#!/bin/bash

echo "🧠 EchoMind Setup & Start"
echo "========================="

# Check .env exists
if [ ! -f "server/.env" ]; then
  echo ""
  echo "⚠️  No .env file found!"
  echo "   Run: cp server/.env.example server/.env"
  echo "   Then fill in your MONGO_URI and GROQ_API_KEY"
  echo ""
  exit 1
fi

# Install root deps (concurrently)
echo "📦 Installing root dependencies..."
npm install

# Install server deps
echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# Install client deps
echo "📦 Installing client dependencies..."
cd client && npm install && cd ..

echo ""
echo "✅ All dependencies installed!"
echo "🚀 Starting EchoMind..."
echo "   Backend  → http://localhost:5000"
echo "   Frontend → http://localhost:3000"
echo ""

npm run dev
