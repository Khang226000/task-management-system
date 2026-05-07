@echo off
title Backup Du lieu
color 0A

:: Tao thu muc backup neu chua co
if not exist "backups" mkdir backups

:: Ten file backup theo ngay gio
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set DATE=%%c%%b%%a
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a%%b
set BACKUP_NAME=backup_%DATE%_%TIME%

:: Copy database
copy "backend\data\taskmaster.db" "backups\%BACKUP_NAME%.db" >nul

:: Copy uploads
if exist "backend\uploads" (
    xcopy "backend\uploads" "backups\%BACKUP_NAME%_uploads\" /E /I /Q >nul
)

echo.
echo  [OK] Backup thanh cong!
echo  File: backups\%BACKUP_NAME%.db
echo.
pause
