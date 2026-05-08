@echo off
title TaskMaster - Cai dat Database
color 0B

echo ================================================
echo   TASKMASTER - Cai dat Database lan dau
echo ================================================
echo.
echo Buoc nay chi can chay 1 LAN DUY NHAT khi cai moi.
echo.

set /p DB_PASS=Nhap mat khau MySQL root: 

echo.
echo [1/3] Tao database...
mysql -u root -p%DB_PASS% -e "CREATE DATABASE IF NOT EXISTS taskmaster_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %errorlevel% neq 0 (
    echo [LOI] Khong the ket noi MySQL. Kiem tra lai mat khau.
    pause
    exit /b 1
)
echo [OK] Database da tao.

echo.
echo [2/3] Cap nhat file cau hinh...
(
echo PORT=5000
echo NODE_ENV=production
echo DB_HOST=localhost
echo DB_PORT=3306
echo DB_NAME=taskmaster_db
echo DB_USER=root
echo DB_PASSWORD=%DB_PASS%
echo JWT_SECRET=taskmaster_internal_%RANDOM%%RANDOM%_secret
echo JWT_EXPIRES_IN=30d
echo FRONTEND_URL=http://localhost:5173
) > backend\.env
echo [OK] File .env da cap nhat.

echo.
echo [3/3] Tao du lieu mau...
cd backend
call npm install --production >nul 2>&1
node src/database/seed.js
cd ..

echo.
echo ================================================
echo   Cai dat hoan tat!
echo.
echo   Tai khoan admin: admin@taskmaster.com
echo   Mat khau:        admin123
echo.
echo   Hay chay start-server.bat de khoi dong.
echo ================================================
pause
