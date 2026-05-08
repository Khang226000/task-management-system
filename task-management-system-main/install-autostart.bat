@echo off
title CASIC Task - Cai dat tu dong khoi dong
color 0E
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   CASIC Task — Cai dat tu dong khoi dong         ║
echo  ╚══════════════════════════════════════════════════╝
echo.

:: Kiem tra quyen admin
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo  [LOI] Can chay voi quyen Administrator.
    echo  Chuot phai vao file nay -^> "Run as administrator"
    pause
    exit /b 1
)

set CURRENT_DIR=%~dp0
set CURRENT_DIR=%CURRENT_DIR:~0,-1%

:: Tao file VBS chay an (khong hien cua so CMD, tu dong co quyen admin)
set VBS_FILE=%CURRENT_DIR%\taskmaster-autostart.vbs
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo ' Chay voi quyen admin
echo WshShell.Run "powershell -Command ""Start-Process cmd -ArgumentList '/c cd /d """"^& "%CURRENT_DIR%\backend" ^& """" ^&^& node src/server.js ^>^> """"^& "%CURRENT_DIR%\server.log" ^& """" 2^>^&1' -Verb RunAs -WindowStyle Hidden""", 0, False
) > "%VBS_FILE%"

:: Them vao Task Scheduler (chay khi khoi dong, co quyen SYSTEM)
schtasks /create /tn "CASICTask" /tr "wscript.exe \"%VBS_FILE%\"" /sc onstart /ru SYSTEM /f >nul 2>&1
if %errorlevel% equ 0 (
    echo  [OK] Da them vao Task Scheduler - tu dong chay khi bat may
) else (
    :: Fallback: them vao Startup folder
    set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
    copy "%VBS_FILE%" "%STARTUP_DIR%\CASICTask.vbs" >nul
    echo  [OK] Da them vao Startup folder
)

:: Tao shortcut tren Desktop
set DESKTOP=%USERPROFILE%\Desktop
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%DESKTOP%\CASIC Task.lnk'); $s.TargetPath = 'https://casictask.local'; $s.Description = 'Mo CASIC Task'; $s.Save()" >nul 2>&1
echo  [OK] Da tao shortcut "CASIC Task" tren Desktop

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   HOAN TAT!                                      ║
echo  ║                                                  ║
echo  ║   Server se tu dong chay khi bat may             ║
echo  ║   Nhan vien truy cap: https://casictask.local    ║
echo  ║                                                  ║
echo  ║   Nho chay install-cert.bat tren may nhan vien   ║
echo  ╚══════════════════════════════════════════════════╝
echo.
pause
