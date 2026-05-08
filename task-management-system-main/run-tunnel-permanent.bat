@echo off
title CASIC Task - Tunnel co dinh
color 0B
chcp 65001 >nul 2>&1

set CF=%~dp0cloudflare\cloudflared.exe
set CONFIG=%~dp0cloudflare\config.yml

if not exist "%CONFIG%" (
    echo  [LOI] Chua cai dat tunnel. Chay setup-tunnel-permanent.bat truoc.
    pause
    exit /b 1
)

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   CASIC Task — Tunnel co dinh dang chay              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Dang ket noi... (cho 10 giay)
echo.

"%CF%" tunnel --config "%CONFIG%" run

pause
