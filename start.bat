@echo off
echo Starting PhotoMaster services...
docker-compose up -d

echo Waiting for services to be ready...
timeout /t 10 /nobreak

echo Opening PhotoMaster in your default browser...
start http://localhost:3000

echo PhotoMaster is running!
echo Frontend: http://localhost:3000
echo Chat Server: http://localhost:5000
echo Laravel API: http://localhost:8000
echo.
echo To stop all services, run: docker-compose down 