@echo off
title CASIC Task - He thong quan ly cong viec
color 0A
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║        CASIC Task — Quan ly cong viec noi bo         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ── Kiem tra quyen admin (can de dung port 443/80) ──────────
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Can quyen Administrator de chay HTTPS (port 443).
    echo  Dang tu dong chay lai voi quyen admin...
    echo.
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: ── Kiem tra Node.js ─────────────────────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [LOI] Chua cai Node.js!
    echo  Tai tai: https://nodejs.org (chon ban LTS)
    echo  Sau khi cai xong, chay lai file nay.
    pause
    exit /b 1
)

:: ── Cai dependencies neu chua co ────────────────────────────
if not exist "%~dp0backend\node_modules" (
    echo  [*] Cai dat thu vien lan dau (cho 1-2 phut)...
    cd /d "%~dp0backend"
    call npm install --production
    cd /d "%~dp0"
    echo  [OK] Xong.
    echo.
)

:: ── Tao SSL cert neu chua co ─────────────────────────────────
if not exist "%~dp0backend\certs\server.crt" (
    echo  [*] Tao SSL certificate...
    cd /d "%~dp0backend"
    node generate-cert.js
    cd /d "%~dp0"
    echo.
)

:: ── Kill process cu neu co ───────────────────────────────────
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":443 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":80 " ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: ── Them casictask.local vao hosts cua may chu ───────────────
findstr /i "casictask.local" "%SystemRoot%\System32\drivers\etc\hosts" >nul 2>&1
if %errorlevel% neq 0 (
    echo 127.0.0.1    casictask.local >> "%SystemRoot%\System32\drivers\etc\hosts"
)

:: ── Lay IP may chu ───────────────────────────────────────────
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

:: ── Khoi dong server ─────────────────────────────────────────
echo  [*] Dang khoi dong server...
echo.
start "CASIC Task Server" cmd /k "cd /d %~dp0backend && node src/server.js"

:: ── Doi server khoi dong ─────────────────────────────────────
timeout /t 5 /nobreak >nul

echo  ╔══════════════════════════════════════════════════════╗
echo  ║   HE THONG DA SAN SANG!                              ║
echo  ║                                                      ║
echo  ║   Nhan vien truy cap:                                ║
echo  ║   https://casictask.local                            ║
echo  ║                                                      ║
echo  ║   IP may chu: %LOCAL_IP%
echo  ║   (Nhan vien can chay install-cert.bat 1 lan)        ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: Mo trinh duyet tren may chu
start https://casictask.local

echo  Cua so nay co the dong. Server van chay nen tang.
echo  De dung server: chay stop-server.bat
echo.
pause >nul
