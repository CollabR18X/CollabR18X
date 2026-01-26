# Script to fix missing esbuild binaries
Write-Host "=== Fixing Esbuild Binaries ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Turn off npm offline mode
Write-Host "1. Configuring npm..." -ForegroundColor Cyan
npm config set offline false
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] npm offline mode disabled" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] Could not change npm config" -ForegroundColor Yellow
}

# Step 2: Clear npm cache
Write-Host "`n2. Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force
if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] npm cache cleared" -ForegroundColor Green
} else {
    Write-Host "   [WARNING] Cache clear had issues" -ForegroundColor Yellow
}

# Step 3: Check current esbuild status
Write-Host "`n3. Checking esbuild binaries..." -ForegroundColor Cyan
$mainBin = "node_modules\esbuild\bin\esbuild.exe"
$viteBin = "node_modules\vite\node_modules\esbuild\bin\esbuild.exe"

$mainExists = Test-Path $mainBin
$viteExists = Test-Path $viteBin

Write-Host "   Main esbuild.exe: $(if ($mainExists) { '[OK]' } else { '[MISSING]' })" -ForegroundColor $(if ($mainExists) { 'Green' } else { 'Red' })
Write-Host "   Vite esbuild.exe: $(if ($viteExists) { '[OK]' } else { '[MISSING]' })" -ForegroundColor $(if ($viteExists) { 'Green' } else { 'Red' })

# Step 4: Try to reinstall esbuild
if (-not $mainExists -or -not $viteExists) {
    Write-Host "`n4. Reinstalling esbuild..." -ForegroundColor Cyan
    Write-Host "   This may take a few minutes..." -ForegroundColor Gray
    
    # Try installing esbuild
    npm install esbuild@latest --save-dev --no-offline 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] esbuild reinstalled" -ForegroundColor Green
    } else {
        Write-Host "   [WARNING] Installation had issues - may need manual fix" -ForegroundColor Yellow
    }
    
    # Check again
    Write-Host "`n5. Verifying installation..." -ForegroundColor Cyan
    $mainExists = Test-Path $mainBin
    $viteExists = Test-Path $viteBin
    
    Write-Host "   Main esbuild.exe: $(if ($mainExists) { '[OK]' } else { '[STILL MISSING]' })" -ForegroundColor $(if ($mainExists) { 'Green' } else { 'Red' })
    Write-Host "   Vite esbuild.exe: $(if ($viteExists) { '[OK]' } else { '[STILL MISSING]' })" -ForegroundColor $(if ($viteExists) { 'Green' } else { 'Red' })
    
    if (-not $mainExists -or -not $viteExists) {
        Write-Host "`n[ACTION REQUIRED]" -ForegroundColor Yellow
        Write-Host "The binaries are still missing. This is likely due to:" -ForegroundColor White
        Write-Host "1. Windows Defender blocking the installation" -ForegroundColor White
        Write-Host "2. Antivirus software blocking npm" -ForegroundColor White
        Write-Host "3. npm cache/network issues" -ForegroundColor White
        Write-Host "`nRecommended fix:" -ForegroundColor Cyan
        Write-Host "1. Add Windows Defender exclusion for: $(Get-Location)" -ForegroundColor White
        Write-Host "2. Run PowerShell as Administrator" -ForegroundColor White
        Write-Host "3. Then run: Remove-Item -Recurse -Force node_modules; npm install" -ForegroundColor White
    }
} else {
    Write-Host "`n[SUCCESS] All esbuild binaries are present!" -ForegroundColor Green
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "After fixing, try: npm run dev" -ForegroundColor White
