#!/bin/bash
echo "Building CodeArena Docker images..."

docker build -t codearena-cpp:latest ./cpp
echo "✅ C++ image built"

docker build -t codearena-java:latest ./java
echo "✅ Java image built"

docker build -t codearena-python:latest ./python
echo "✅ Python image built"

docker build -t codearena-javascript:latest ./javascript
echo "✅ JavaScript image built"

echo "All images built successfully!"
docker images | grep codearena