#!/bin/bash

# Development Setup Script for Archizer
# This script sets up the development environment

echo "🚀 Setting up Archizer development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create config file if it doesn't exist
if [ ! -f "config.js" ]; then
    echo "⚙️  Creating config.js from example..."
    cp config.example.js config.js
    echo "⚠️  Please update config.js with your actual configuration values"
fi

# Create icons directory if it doesn't exist
if [ ! -d "icons" ]; then
    echo "🖼️  Creating icons directory..."
    mkdir -p icons
fi

# Build the extension
echo "🔨 Building extension..."
npm run build:dev

echo "✅ Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Update config.js with your Google OAuth credentials"
echo "2. Add actual icon files to the icons/ directory"
echo "3. Run 'npm run dev' to start development mode"
echo "4. Load the extension in Chrome from the dist/ directory"
