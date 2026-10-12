@echo off
setlocal enabledelayedexpansion
title ScoutX AI - Docker Deployment Launcher

echo ==============================================================================
echo  ⚽ ScoutX AI - Universal Football Talent Assessment Platform (Docker Mode)
echo ==============================================================================
echo.

:: 1. Check if Docker is installed
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker was not found in your system PATH!
    echo.
    echo Please make sure Docker Desktop is installed:
    echo 1. Download and install Docker Desktop: https://www.docker.com/products/docker-desktop/
    echo 2. Enable WSL 2 backend during installation.
    echo 3. Start Docker Desktop and re-run this script.
    echo.
    echo NOTE: If you want to run without Docker right now, you can use:
    echo       start_project.bat
    echo ==============================================================================
    pause
    exit /b 1
)

:: 2. Check if Docker Daemon is running
docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is installed but the Docker daemon is NOT running!
    echo.
    echo Please open the 'Docker Desktop' application from your Start Menu,
    echo wait for it to show 'Engine running' (green icon), and then run this script again.
    echo ==============================================================================
    pause
    exit /b 1
)

:: 3. Detect Host LAN IPv4 Address
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "0.0.0.0.*0.0.0.0"') do (
    set "HOST_IP=%%a"
)
if "%HOST_IP%"=="" (
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
        set "RAW_IP=%%a"
        set "HOST_IP=!RAW_IP: =!"
    )
)

echo [OK] Docker Engine is active and ready.
echo [INFO] Detected Host LAN IP: %HOST_IP%
echo.
echo ------------------------------------------------------------------------------
echo  Building and Launching ScoutX AI Microservices with Docker Compose...
echo ------------------------------------------------------------------------------
echo.

:: 4. Build and start containers
docker compose up --build -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Compose failed to start the containers.
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ==============================================================================
echo  🚀 SCOUTX AI SERVICES ARE RUNNING IN DOCKER CONTAINERS!
echo ==============================================================================
echo.
echo  🖥️  LOCAL MACHINE ACCESS:
echo     - Frontend Web:   http://localhost:8081
echo     - Backend API:    http://localhost:5000
echo     - AI CV Engine:   http://localhost:8000
echo     - MongoDB:        localhost:27017
echo.
if not "%HOST_IP%"=="" (
echo  🌐 LAN / FRIEND'S COMPUTER ACCESS (Same Wi-Fi):
echo     - Frontend Web:   http://%HOST_IP%:8081
echo     - Backend API:    http://%HOST_IP%:5000
echo.
)
echo  🔑 DEMO LOGIN CREDENTIALS:
echo     - Player:  neeraj@scoutx.com   / password123
echo     - Coach:   coach@scoutx.com    / password123
echo     - Admin:   admin@scoutx.com    / password123
echo.
echo  🛑 To stop all containers: run 'docker-stop.bat' or 'docker compose down'
echo ==============================================================================
echo.
echo Streaming live logs (Press Ctrl+C to stop following logs; containers keep running):
echo.
docker compose logs -f
