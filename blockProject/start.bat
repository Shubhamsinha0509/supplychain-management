@echo off
echo Starting Blockchain Supply Chain Application...
echo.

echo Starting API Gateway on port 3000...
start "API Gateway" cmd /k "cd packages\api-gateway && node src\server.js"

echo Starting Web Dashboard on port 3001...
start "Web Dashboard" cmd /k "cd packages\web-dashboard && npm run dev -- --port 3001"

echo.
echo Services starting...
echo API Gateway: http://localhost:3000
echo Web Dashboard: http://localhost:3001
echo.
echo Press any key to stop all services...
pause > nul

echo Stopping services...
taskkill /f /im node.exe
echo All services stopped.
