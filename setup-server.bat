@echo off
title TaskMaster - Cai dat may chu
color 0A
chcp 65001 >nul 2>&1

echo.
echo  ================================================
echo    TASKMASTER - Cai dat may chu lan dau
echo  ================================================
echo.

:: Kiem tra quyen admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  [LOI] Can chay voi quyen Administrator.
    echo  Chuot phai vao file nay -^> "Run as administrator"
    echo.
    pause
    exit /b 1
)

:: ── Kiem tra Node.js ──────────────────────────────────────
echo  [1/5] Kiem tra Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [!] Chua cai Node.js.
    echo      Vui long tai va cai Node.js LTS tai:
    echo      https://nodejs.org
    echo.
    echo      Sau khi cai xong, chay lai file nay.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  [OK] Node.js %NODE_VER%

:: ── Cai dependencies ──────────────────────────────────────
echo.
echo  [2/5] Cai dat thu vien backend...
cd /d "%~dp0backend"
call npm install --production --silent
if %errorlevel% neq 0 (
    echo  [LOI] Khong the cai thu vien. Kiem tra ket noi internet.
    pause
    exit /b 1
)
echo  [OK] Thu vien da san sang

:: ── Kiem tra SQL Server ───────────────────────────────────
echo.
echo  [3/5] Kiem tra SQL Server...
sc query MSSQLSERVER >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] SQL Server dang chay
    goto :sql_ok
)
sc query "MSSQL$SQLEXPRESS" >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] SQL Server Express dang chay
    goto :sql_ok
)
echo.
echo  [!] Khong tim thay SQL Server.
echo      Vui long cai SQL Server Express (mien phi) tai:
echo      https://www.microsoft.com/en-us/sql-server/sql-server-downloads
echo.
echo      Chon "Basic" khi cai dat.
echo      Sau khi cai xong, chay lai file nay.
echo.
pause
exit /b 1

:sql_ok

:: ── Mo port tuong lua ─────────────────────────────────────
echo.
echo  [4/5] Mo cong 5000 tren tuong lua Windows...
netsh advfirewall firewall show rule name="TaskMaster Port 5000" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="TaskMaster Port 5000" dir=in action=allow protocol=TCP localport=5000 >nul
    echo  [OK] Da mo cong 5000
) else (
    echo  [OK] Cong 5000 da duoc mo truoc do
)

:: ── Cai tu dong khoi dong ─────────────────────────────────
echo.
echo  [5/5] Cai dat tu dong khoi dong cung Windows...
set CURRENT_DIR=%~dp0
set CURRENT_DIR=%CURRENT_DIR:~0,-1%
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

:: Tao file VBS chay an (khong hien cua so CMD)
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.Run "cmd /c cd /d ""%CURRENT_DIR%\backend"" ^&^& node src/server.js ^>^> ""%CURRENT_DIR%\server.log"" 2^>^&1", 0, False
) > "%STARTUP_DIR%\TaskMaster.vbs"

echo  [OK] Server se tu dong chay khi bat may

:: ── Lay IP may chu ────────────────────────────────────────
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set LOCAL_IP=%%a
    goto :found_ip
)
:found_ip
set LOCAL_IP=%LOCAL_IP: =%

:: ── Hoan tat ──────────────────────────────────────────────
echo.
echo  ================================================
echo    CAI DAT HOAN TAT!
echo.
echo    Khoi dong server: double-click start-server.bat
echo.
echo    Dia chi truy cap:
echo    - May chu nay : http://localhost:5000
echo    - May nhan vien: http://%LOCAL_IP%:5000
echo.
echo    Nhan vien chi can mo Chrome va go dia chi tren.
echo    KHONG can cai them bat cu phan mem nao.
echo  ================================================
echo.
pause
