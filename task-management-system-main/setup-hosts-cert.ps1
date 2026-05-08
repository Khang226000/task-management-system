# ============================================================
# CASIC Task - Cai dat hosts + certificate
# Chay tren MAY CHU (lan dau) va MAY NHAN VIEN (moi may 1 lan)
# ============================================================
param(
    [string]$ServerIP = ""
)

# Tu dong elevate neu chua co quyen admin
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]"Administrator")) {
    $args2 = "-ExecutionPolicy Bypass -File `"$PSCommandPath`""
    if ($ServerIP) { $args2 += " -ServerIP $ServerIP" }
    Start-Process powershell -ArgumentList $args2 -Verb RunAs -Wait
    exit
}

$scriptDir = Split-Path -Parent $PSCommandPath
$hostsFile = "$env:SystemRoot\System32\drivers\etc\hosts"
$certPath  = Join-Path $scriptDir "backend\certs\ca.crt"

Write-Host ""
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host "   CASIC Task - Cai dat ket noi an toan (HTTPS)" -ForegroundColor Cyan
Write-Host "  ================================================" -ForegroundColor Cyan
Write-Host ""

# ── Hoi IP may chu neu chua co ────────────────────────────
if (-not $ServerIP) {
    Write-Host "  Nhap IP may chu (VD: 192.168.1.100)" -ForegroundColor Yellow
    Write-Host "  (Neu day la may chu, nhan Enter de dung 127.0.0.1)" -ForegroundColor Gray
    $ServerIP = Read-Host "  IP may chu"
    if (-not $ServerIP) { $ServerIP = "127.0.0.1" }
}
Write-Host "  Su dung IP: $ServerIP" -ForegroundColor White
Write-Host ""

# ── 1. Cai CA certificate ─────────────────────────────────
Write-Host "  [1/3] Cai chung chi bao mat..." -ForegroundColor Yellow
if (Test-Path $certPath) {
    try {
        $cert  = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new($certPath)
        $store = [System.Security.Cryptography.X509Certificates.X509Store]::new("Root","LocalMachine")
        $store.Open("ReadWrite")
        # Xoa cert cu cung Subject neu co
        $old = $store.Certificates | Where-Object { $_.Subject -match "casictask" }
        foreach ($o in $old) { $store.Remove($o) }
        $store.Add($cert)
        $store.Close()
        Write-Host "  [OK] Chung chi da cai - hieu luc den $($cert.NotAfter.ToString('dd/MM/yyyy'))" -ForegroundColor Green
    } catch {
        Write-Host "  [!] Loi cai chung chi: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  [!] Khong tim thay: $certPath" -ForegroundColor Red
    Write-Host "      Sao chep thu muc 'backend\certs' vao may nay roi chay lai." -ForegroundColor Yellow
}

# ── 2. Them casictask.local vao hosts ─────────────────────
Write-Host "  [2/3] Cap nhat hosts file..." -ForegroundColor Yellow
try {
    $lines = [System.IO.File]::ReadAllLines($hostsFile)
    $lines = $lines | Where-Object { $_ -notmatch "casictask\.local" }
    $lines += "$ServerIP    casictask.local"
    [System.IO.File]::WriteAllLines($hostsFile, $lines, [System.Text.Encoding]::ASCII)
    Write-Host "  [OK] Da them: $ServerIP  casictask.local" -ForegroundColor Green
} catch {
    Write-Host "  [!] Loi ghi hosts: $_" -ForegroundColor Red
}

# ── 3. Flush DNS ──────────────────────────────────────────
Write-Host "  [3/3] Lam moi DNS cache..." -ForegroundColor Yellow
ipconfig /flushdns | Out-Null
Write-Host "  [OK] DNS cache da xoa" -ForegroundColor Green

# ── Ket qua ───────────────────────────────────────────────
Write-Host ""
Write-Host "  ================================================" -ForegroundColor Green
Write-Host "   HOAN TAT! Khoi dong lai trinh duyet Chrome." -ForegroundColor Green
Write-Host ""
Write-Host "   Truy cap: https://casictask.local" -ForegroundColor White
Write-Host "  ================================================" -ForegroundColor Green
Write-Host ""

$open = Read-Host "  Mo Chrome ngay? (Y/N)"
if ($open -eq "Y" -or $open -eq "y") {
    Start-Process "chrome" "https://casictask.local" -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) { Start-Process "https://casictask.local" }
}
