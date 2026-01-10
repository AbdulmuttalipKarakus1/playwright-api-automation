#!/bin/bash

echo "🔍 Checking container runtime (Docker/Colima)..."
echo ""

# Check if docker command exists
if ! command -v docker &> /dev/null; then
    echo "❌ Docker CLI is not installed!"
    echo ""
    echo "Please run the setup script:"
    echo "  npm run setup:colima"
    echo ""
    echo "Or install manually:"
    echo "  brew install colima docker"
    echo "  colima start"
    exit 1
fi

echo "✓ Docker CLI is installed"
docker --version
echo ""

# Check if Docker daemon is running (Colima or Docker Desktop)
if ! docker ps &> /dev/null; then
    echo "❌ Container runtime is not running!"
    echo ""
    echo "Starting Colima..."
    colima start --cpu 2 --memory 4 --disk 10

    # Wait for startup
    sleep 5

    # Check again
    if ! docker ps &> /dev/null; then
        echo "❌ Failed to start container runtime"
        echo ""
        echo "Manual steps:"
        echo "  1. colima start"
        echo "  2. docker ps"
        exit 1
    fi
fi

echo "✓ Container runtime is running"
echo ""

# Check if it's Colima or Docker Desktop
if colima status &> /dev/null; then
    echo "📦 Runtime: Colima"
    colima status
else
    echo "📦 Runtime: Docker Desktop"
fi

echo ""

# Show running containers
echo "🐳 Running containers:"
docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}" || echo "No containers running"
echo ""

# Check Docker system info
echo "💾 Docker system info:"
docker system df 2>/dev/null || echo "Unable to get system info"
echo ""

echo "✅ Container runtime is ready for TestContainers!"
echo ""