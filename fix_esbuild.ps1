# Script to help fix esbuild EPERM error on Windows
Write-Host "=== Esbuild EPERM Error Fix Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[WARNING] Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some fixes may require admin privileges" -ForegroundColor Yellow
    Write-Host ""
}

# Check esbuild installation
Write-Host "1. Checking esbuild installation..." -ForegroundColor Cyan
$esbuildPath = "node_modules\esbuild\esbuild.exe"
if (Test-Path $esbuildPath) {
    Write-Host "   [OK] esbuild.exe found" -ForegroundColor Green
    $fileInfo = Get-Item $esbuildPath
    Write-Host "   Location: $($fileInfo.FullName)" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($fileInfo.Length / 1MB, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "   [MISSING] esbuild.exe not found" -ForegroundColor Red
    Write-Host "   This may be the issue - esbuild binary is missing" -ForegroundColor Yellow
}

Write-Host ""

# Check nested esbuild (used by Vite)
Write-Host "2. Checking Vite's esbuild..." -ForegroundColor Cyan
$viteEsbuildPath = "node_modules\vite\node_modules\esbuild\esbuild.exe"
if (Test-Path $viteEsbuildPath) {
    Write-Host "   [OK] Vite's esbuild.exe found" -ForegroundColor Green
} else {
    Write-Host "   [MISSING] Vite's esbuild.exe not found" -ForegroundColor Red
    Write-Host "   This is likely the issue!" -ForegroundColor Yellow
}

Write-Host ""

# Provide solutions
Write-Host "=== Solutions ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Add Windows Defender Exclusion (Recommended)" -ForegroundColor Yellow
Write-Host "  1. Press Win + I to open Settings" -ForegroundColor White
Write-Host "  2. Go to Privacy & Security > Windows Security" -ForegroundColor White
Write-Host "  3. Open Windows Security app" -ForegroundColor White
Write-Host "  4. Virus & threat protection > Manage settings" -ForegroundColor White
Write-Host "  5. Scroll to Exclusions > Add or remove exclusions" -ForegroundColor White
Write-Host "  6. Add folder: $(Get-Location)" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Reinstall esbuild" -ForegroundColor Yellow
Write-Host "  npm install esbuild --save-dev" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor White
Write-Host ""
Write-Host "Option 3: Run as Administrator" -ForegroundColor Yellow
Write-Host "  Right-click PowerShell > Run as Administrator" -ForegroundColor White
Write-Host "  Then run: npm run dev" -ForegroundColor White
Write-Host ""

# Try to reinstall esbuild if missing
if (-not (Test-Path $viteEsbuildPath)) {
    Write-Host "Attempting to fix by reinstalling esbuild..." -ForegroundColor Cyan
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    npm install esbuild --save-dev
    Write-Host ""
}

Write-Host "After applying a solution, try running 'npm run dev' again" -ForegroundColor Green
