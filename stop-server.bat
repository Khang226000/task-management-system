@echo off
title CASIC Task - Dung server
color 0C
chcp 65001 >nul 2>&1

echo.
echo  Dang dung CASIC Task server...

:: Kill tat ca node processes
taskkill /F /IM node.exe >nul 2>&1

:: Kiem tra
timeout /t 2 /nobreak >nul
tasklist | findstr "node.exe" >nul 2>&1
if %errorlevel% neq 0 (
    echo  [OK] Server da dung.
) else (
    echo  [!] Van con process dang chay. Thu lai...
    taskkill /F /IM node.exe >nul 2>&1
)

echo.
pause
