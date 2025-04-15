#!/bin/bash

# Start all services using Docker Compose
echo "Starting PhotoMaster services..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Open the application in the default browser
echo "Opening PhotoMaster in your default browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open http://localhost:3000
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  start http://localhost:3000
else
  echo "Please open http://localhost:3000 in your browser"
fi

echo "PhotoMaster is running!"
echo "Frontend: http://localhost:3000"
echo "Chat Server: http://localhost:5000"
echo "Laravel API: http://localhost:8000"
echo ""
echo "To stop all services, run: docker-compose down" 