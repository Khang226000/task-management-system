@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════════╗
echo ║     BUILD PRODUCTION - CASIC TASK        ║
echo ╚══════════════════════════════════════════╝
echo.

:: Kiểm tra Node.js
node --version > nul 2>&1
if errorlevel 1 (
    echo [LỖI] Node.js chưa được cài đặt!
    pause
    exit /b 1
)

:: Build frontend
echo [1/3] Cài đặt dependencies frontend...
cd frontend
call npm install --production=false
if errorlevel 1 ( echo [LỖI] npm install frontend thất bại & pause & exit /b 1 )

echo [2/3] Build frontend...
call npm run build
if errorlevel 1 ( echo [LỖI] Build frontend thất bại & pause & exit /b 1 )
cd ..

:: Cài đặt backend dependencies
echo [3/3] Cài đặt dependencies backend...
cd backend
call npm install --omit=dev
if errorlevel 1 ( echo [LỖI] npm install backend thất bại & pause & exit /b 1 )
cd ..

echo.
echo ✅ Build hoàn tất!
echo.
echo Bước tiếp theo:
echo   1. Kiểm tra file backend\.env đã cấu hình đúng
echo   2. Chạy: node backend/scripts/setup-db.js  (kiểm tra database)
echo   3. Chạy: start-server.bat  (khởi động server)
echo.
pause
