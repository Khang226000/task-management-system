@echo off
title CASIC Task - Cloudflare Tunnel (Truy cap tu xa)
color 0B
chcp 65001 >nul 2>&1

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║   CASIC Task — Cloudflare Tunnel                     ║
echo  ║   Tao duong dan truy cap tu xa qua internet          ║
echo  ╚══════════════════════════════════════════════════════╝
echo.
echo  Dang ket noi Cloudflare... (cho 10-15 giay)
echo.
echo  SAO CHEP LINK HTTPS xuat hien ben duoi gui cho nguoi dung
echo  ============================================================
echo.

"%~dp0cloudflare\cloudflared.exe" tunnel --url https://localhost:443 --no-tls-verify

pause
