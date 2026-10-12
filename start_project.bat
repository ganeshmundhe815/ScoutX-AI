@echo off
TITLE ScoutX AI - Launch All Services
COLOR 0A

echo ===================================================
echo       SCOUTX AI - FULL SYSTEM LAUNCHER
echo ===================================================
echo.
echo Starting 3 Microservices in Separate Terminals:
echo   [1] Python AI Service   - Port 8000 (MediaPipe + YOLO)
echo   [2] Node.js Backend     - Port 5000 (Express + MongoDB)
echo   [3] Expo Frontend       - Port 8081 (React Native Web/Mobile)
echo.
echo ===================================================

:: Navigate to Project Root
cd /d "%~dp0"

:: 1. Launch Python AI Service
echo [1/3] Launching Python AI Microservice on Port 8000...
start "ScoutX AI - [1] Python Microservice (Port 8000)" cmd /k "cd /d "%~dp0ai_service" && python app.py"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 2. Launch Node.js Backend
echo [2/3] Launching Node.js Backend API on Port 5000...
start "ScoutX AI - [2] Node Backend API (Port 5000)" cmd /k "cd /d "%~dp0backend" && npm run dev"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: 3. Launch Expo Frontend
echo [3/3] Launching Expo Frontend Web/Mobile on Port 8081...
start "ScoutX AI - [3] Expo Frontend (Port 8081)" cmd /k "cd /d "%~dp0frontend" && npx expo start --web --port 8081"

echo.
echo ===================================================
echo   ALL 3 SERVICES LAUNCHED SUCCESSFULLY!
echo ===================================================
echo.
echo   >> Web App URL:      http://localhost:8081
echo   >> Backend API:      http://localhost:5000/api
echo   >> AI Microservice:  http://localhost:8000
echo.
echo   Demo Accounts (Password: password123):
echo     - Player: player@scoutx.com
echo     - Coach:  coach@scoutx.com
echo     - Admin:  admin@scoutx.com
echo.
echo Press any key to exit this launcher window...
pause >nul



// ./start_project.ps1
