@echo off
title CASIC Task - Quick Tunnel (Thu nhanh)
color 0B
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   CASIC Task — Quick Tunnel                          ║
echo  ║   Tao link truy cap tu xa trong 30 giay              ║
echo  ║   (Khong can tai khoan Cloudflare)                   ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

set CF_EXE=%~dp0cloudflare\cloudflared.exe

:: Tai cloudflared neu chua co
if not exist "%CF_EXE%" (
    echo  [*] Dang tai cloudflared...
    if not exist "%~dp0cloudflare" mkdir "%~dp0cloudflare"
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CF_EXE%' -UseBasicParsing"
    if not exist "%CF_EXE%" (
        echo  [LOI] Khong tai duoc. Kiem tra ket noi internet.
        pause
        exit /b 1
    )
    echo  [OK] Tai xong.
    echo.
)

echo  [*] Dang tao tunnel...
echo  Doi 10-20 giay de lay duoc link...
echo.
echo  *** SAO CHEP LINK HTTPS bên dưới gui cho nhan vien ***
echo.

:: Chay quick tunnel — tu dong tao link ngau nhien
"%CF_EXE%" tunnel --url https://localhost:443 --no-tls-verify

pause
