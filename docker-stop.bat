@echo off
title ScoutX AI - Docker Stop Script

echo ==============================================================================
echo  🛑 Stopping ScoutX AI Docker Containers...
echo ==============================================================================
echo.

docker compose down

echo.
echo ==============================================================================
echo  ✅ All ScoutX AI containers have been cleanly stopped.
echo ==============================================================================
pause
