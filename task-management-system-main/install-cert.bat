@echo off
title CASIC Task - Cai dat ket noi an toan
color 0B
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   CASIC Task — Cai dat ket noi an toan (HTTPS)  ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Chay script cai dat (se hien hop thoai xac nhan admin)...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0setup-hosts-cert.ps1"

pause
