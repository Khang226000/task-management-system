@echo off
title CASIC Task - Cai dat Cloudflare Tunnel
color 0B
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   CASIC Task — Cai dat Cloudflare Tunnel             ║
echo  ║   Truy cap tu xa qua internet (mien phi)             ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Yeu cau: Da co tai khoan Cloudflare (cloudflare.com)
echo.

:: Kiem tra quyen admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  [!] Can quyen Administrator.
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

set INSTALL_DIR=%~dp0cloudflare
set CF_EXE=%INSTALL_DIR%\cloudflared.exe

:: Tao thu muc
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

:: Kiem tra da cai chua
if exist "%CF_EXE%" (
    echo  [OK] cloudflared da co san.
    goto :login
)

:: Tai cloudflared
echo  [1/3] Dang tai cloudflared...
powershell -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CF_EXE%' -UseBasicParsing"
if not exist "%CF_EXE%" (
    echo  [LOI] Khong tai duoc. Kiem tra ket noi internet.
    pause
    exit /b 1
)
echo  [OK] Tai xong.

:login
echo.
echo  [2/3] Dang nhap Cloudflare...
echo  Trinh duyet se mo ra, dang nhap tai khoan Cloudflare cua ban.
echo  Sau khi dang nhap xong, quay lai cua so nay.
echo.
pause

"%CF_EXE%" tunnel login

echo.
echo  [3/3] Tao tunnel...
set /p TUNNEL_NAME="  Dat ten tunnel (VD: casictask): "
if "%TUNNEL_NAME%"=="" set TUNNEL_NAME=casictask

"%CF_EXE%" tunnel create %TUNNEL_NAME%

echo.
echo  Tao file cau hinh tunnel...

:: Lay tunnel ID
for /f "tokens=*" %%i in ('"%CF_EXE%" tunnel list ^| findstr "%TUNNEL_NAME%"') do set TUNNEL_LINE=%%i
echo  Tunnel: %TUNNEL_LINE%

:: Tao config file
(
echo ingress:
echo   - service: https://localhost:443
echo     originRequest:
echo       noTLSVerify: true
echo no-autoupdate: true
) > "%INSTALL_DIR%\config.yml"

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   BUOC TIEP THEO (lam thu cong):                    ║
echo  ║                                                      ║
echo  ║   1. Vao: dash.cloudflare.com                       ║
echo  ║   2. Zero Trust → Networks → Tunnels                ║
echo  ║   3. Chon tunnel "%TUNNEL_NAME%"                    ║
echo  ║   4. Public Hostname → Add hostname:                ║
echo  ║      - Subdomain: casictask                         ║
echo  ║      - Domain: (chon domain cua ban)                ║
echo  ║      - Service: https://localhost:443               ║
echo  ║      - No TLS Verify: ON                            ║
echo  ║                                                      ║
echo  ║   Sau do chay: run-tunnel.bat                       ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
pause
