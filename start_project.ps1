# ScoutX AI - PowerShell Multi-Service Launcher
Write-Host "===================================================" -ForegroundColor Green
Write-Host "      SCOUTX AI - FULL SYSTEM LAUNCHER             " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Starting 3 Services in Separate PowerShell Windows:" -ForegroundColor Cyan
Write-Host "  [1] Python AI Service   - Port 8000" -ForegroundColor White
Write-Host "  [2] Node.js Backend     - Port 5000" -ForegroundColor White
Write-Host "  [3] Expo Frontend       - Port 8081" -ForegroundColor White
Write-Host ""

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Python AI Microservice
Write-Host "[1/3] Starting Python AI Microservice (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath\ai_service'; Write-Host '--- Python AI Service (Port 8000) ---' -ForegroundColor Green; python app.py"

Start-Sleep -Seconds 2

# 2. Start Node.js Backend
Write-Host "[2/3] Starting Node.js Express Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath\backend'; Write-Host '--- Node Backend (Port 5000) ---' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

# 3. Start Expo Frontend
Write-Host "[3/3] Starting Expo Frontend Web Server (Port 8081)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootPath\frontend'; Write-Host '--- Expo Frontend (Port 8081) ---' -ForegroundColor Green; npx expo start --web --port 8081"

Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  ALL 3 SERVICES LAUNCHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  >> Frontend URL:      http://localhost:8081" -ForegroundColor Cyan
Write-Host "  >> Backend API:       http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "  >> Python AI Service: http://localhost:8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Accounts (Password: password123):" -ForegroundColor Yellow
Write-Host "  - Player: player@scoutx.com" -ForegroundColor White
Write-Host "  - Coach:  coach@scoutx.com" -ForegroundColor White
Write-Host "  - Admin:  admin@scoutx.com" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Green