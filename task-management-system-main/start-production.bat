@echo off
title Quan ly Cong viec - Khoi dong
color 0B
echo.
echo  ==========================================
echo   QUAN LY CONG VIEC - HE THONG NOI BO
echo  ==========================================
echo.

:: Kiem tra Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo  [LOI] Chua cai Node.js!
    echo  Vui long cai tai: https://nodejs.org
    pause
    exit /b 1
)

:: Cai dependencies neu chua co
if not exist "backend\node_modules" (
    echo  [1/2] Dang cai dependencies backend...
    cd backend && npm install --production && cd ..
)

:: Chay server
echo  [OK] Dang khoi dong server...
echo.
echo  ==========================================
echo   Truy cap: http://localhost:5000
echo   (Nhan Ctrl+C de dung server)
echo  ==========================================
echo.

cd backend
set NODE_ENV=production
node src/server.js
echo.
pause
