@echo off
title Khoi phuc Du lieu
color 0E

echo.
echo  === KHOI PHUC DU LIEU ===
echo.
echo  Danh sach backup:
dir /b backups\*.db 2>nul
echo.
set /p BACKUP_FILE=Nhap ten file backup (vi du: backup_20260428_0900.db): 

if not exist "backups\%BACKUP_FILE%" (
    echo  [LOI] Khong tim thay file: %BACKUP_FILE%
    pause
    exit /b 1
)

echo.
echo  [CANH BAO] Thao tac nay se ghi de du lieu hien tai!
set /p CONFIRM=Ban co chac khong? (yes/no): 
if /i not "%CONFIRM%"=="yes" (
    echo  Da huy.
    pause
    exit /b 0
)

copy "backups\%BACKUP_FILE%" "backend\data\taskmaster.db" >nul
echo.
echo  [OK] Khoi phuc thanh cong tu: %BACKUP_FILE%
echo  Vui long khoi dong lai server.
echo.
pause
