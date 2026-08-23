@echo off
TITLE ScoutX AI - Master Launcher
COLOR 0B
echo ===================================================================
echo               🏆 SCOUTX AI - MASTER SYSTEM LAUNCHER
echo      AI-Powered Mobile Platform for Sports Talent Assessment
echo ===================================================================
echo.

echo [1/3] Starting Python AI & Computer Vision Microservice (Port 8000)...
start "ScoutX - Python AI Engine (Port 8000)" cmd /k "cd ai_service && python app.py"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Node.js + Express Backend API (Port 5000)...
start "ScoutX - Node.js Backend API (Port 5000)" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul

echo [3/3] Starting React Native Mobile Frontend (Port 8081)...
start "ScoutX - React Native Mobile App (Port 8081)" cmd /k "cd frontend && npx expo start --web"

echo.
echo ===================================================================
echo  ✅ ALL SERVICES LAUNCHED SUCCESSFULLY!
echo.
echo  📱 Mobile Frontend : http://localhost:8081
echo  🟢 Express Backend : http://localhost:5000/api/health
echo  🧠 Python AI Engine: http://localhost:8000/health
echo ===================================================================
echo.
pause
