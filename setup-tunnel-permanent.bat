@echo off
title CASIC Task - Cai dat Tunnel co dinh
color 0B
chcp 65001 >nul 2>&1

set CF=%~dp0cloudflare\cloudflared.exe

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   CASIC Task — Cai dat Tunnel co dinh               ║
echo  ║   Tao ten mien truy cap tu xa vinh vien              ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  YEU CAU: Da co tai khoan Cloudflare (cloudflare.com)
echo.
echo  ============================================================
echo  BUOC 1: Dang nhap Cloudflare
echo  Trinh duyet se mo ra, dang nhap tai khoan cua ban.
echo  ============================================================
echo.
pause

"%CF%" tunnel login

echo.
echo  ============================================================
echo  BUOC 2: Tao tunnel co dinh
echo  ============================================================
echo.
set /p TUNNEL_NAME="  Dat ten tunnel (VD: casictask): "
if "%TUNNEL_NAME%"=="" set TUNNEL_NAME=casictask

"%CF%" tunnel create %TUNNEL_NAME%

echo.
echo  ============================================================
echo  BUOC 3: Lay Tunnel ID
echo  ============================================================
"%CF%" tunnel list

echo.
set /p TUNNEL_ID="  Nhap Tunnel ID (chuoi dai phia tren): "

echo.
echo  ============================================================
echo  BUOC 4: Tao file cau hinh
echo  ============================================================

(
echo tunnel: %TUNNEL_ID%
echo credentials-file: %USERPROFILE%\.cloudflared\%TUNNEL_ID%.json
echo.
echo ingress:
echo   - hostname: %TUNNEL_NAME%.cfargotunnel.com
echo     service: https://localhost:443
echo     originRequest:
echo       noTLSVerify: true
echo   - service: http_status:404
) > "%~dp0cloudflare\config.yml"

echo  [OK] Da tao file cau hinh

echo.
echo  ============================================================
echo  BUOC 5: Tao DNS record tren Cloudflare
echo  ============================================================
"%CF%" tunnel route dns %TUNNEL_NAME% %TUNNEL_NAME%.cfargotunnel.com

echo.
echo  ============================================================
echo  HOAN TAT! Chay run-tunnel-permanent.bat de khoi dong.
echo.
echo  Ten mien co dinh: https://%TUNNEL_NAME%.cfargotunnel.com
echo  ============================================================
echo.
pause
