#!/bin/bash

# Function to validate build number (positive integer)
validate_build_number() {
    if ! [[ $1 =~ ^[1-9][0-9]*$ ]]; then
        echo "Error: Build number must be a positive integer"
        echo "Example: 1, 2, 3, etc."
        return 1
    fi
    return 0
}

# Check if build number is provided
if [ -z "$1" ]; then
    echo "Error: Missing build number"
    echo "Usage: ./deploy.sh <build_number>"
    echo "Example: ./deploy.sh 1"
    exit 1
fi

BUILD_NUMBER=$1
IMAGE_NAME="kovadocker/pokr-bot"
CONTAINER_NAME="pokr-bot"

# Validate input
if ! validate_build_number "$BUILD_NUMBER"; then
    exit 1
fi

# Check if image exists in registry
echo "Checking if image exists..."
if ! docker manifest inspect $IMAGE_NAME:$BUILD_NUMBER >/dev/null 2>&1; then
    echo "Error: Image $IMAGE_NAME:$BUILD_NUMBER does not exist"
    exit 1
fi

echo "Deploying $IMAGE_NAME with build: $BUILD_NUMBER"

export IMAGE_NAME BUILD_NUMBER  # Export variables for docker-compose to use

# Pull new image
echo "Pulling new image..."
if ! docker compose -f docker-compose.yml pull; then
    echo "Error: Failed to pull new image"
    exit 1
fi

# Create or replace the container using docker compose
docker compose -f docker-compose.yml up -d

if [ $? -ne 0 ]; then
  echo "Error: Docker Compose failed"
  exit 1
fi

# Verify the container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "Error: Container failed to start"
    echo "Checking container logs:"
    docker logs "$CONTAINER_NAME"
    exit 1
fi

echo "Deployment complete!" 