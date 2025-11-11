#!/bin/bash
# Quick Setup Script for Mac/Linux Users
# Run: bash setup-unix.sh

set -e

echo "=== ReservaSalle Docker Setup ==="
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker version > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    echo "Start Docker Desktop"
    exit 1
fi
echo "✅ Docker is running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found"
    exit 1
fi
echo "✅ Docker Compose found"
echo ""

# Copy .env
if [ ! -f .env ]; then
    echo "Copying .env..."
    cp .env.example .env
    echo "✅ .env created"
else
    echo "✅ .env already exists"
fi

echo ""
echo "Starting Docker containers..."
echo "This may take a minute on first run..."
echo ""

./vendor/bin/sail up -d

echo ""
echo "Waiting for MySQL to be ready..."
sleep 5

echo ""
echo "Running migrations..."
./vendor/bin/sail artisan migrate --seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open 2 new terminals"
echo "2. Terminal 1: ./vendor/bin/sail npm run dev"
echo "3. Terminal 2: ./vendor/bin/sail artisan serve --host=0.0.0.0"
echo ""
echo "Then visit: http://localhost:8000"
echo ""
