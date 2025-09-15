#!/bin/bash

echo "🚀 YouTube Audio API Deployment Script"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
fi

# Start the application with PM2
echo "🚀 Starting application with PM2..."
pm2 start index.js --name "youtube-audio-api" --watch

if [ $? -eq 0 ]; then
    echo "✅ Application started successfully!"
    echo "🌐 Server should be running on port 3000"
    echo "📊 Use 'pm2 status' to check status"
    echo "📝 Use 'pm2 logs youtube-audio-api' to view logs"
    echo "🔄 Use 'pm2 restart youtube-audio-api' to restart"
    echo "🛑 Use 'pm2 stop youtube-audio-api' to stop"
else
    echo "❌ Failed to start application"
    exit 1
fi
