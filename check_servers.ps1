# Quick server status checker
Write-Host "=== Server Status Check ===" -ForegroundColor Cyan
Write-Host ""

# Check Backend
Write-Host "Backend (port 5000): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/auth/user" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "RUNNING" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "NOT RUNNING" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Check Frontend
Write-Host "Frontend (port 5173): " -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:5173" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "RUNNING" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "NOT RUNNING" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Processes:" -ForegroundColor Cyan
Get-Process python,node -ErrorAction SilentlyContinue | Format-Table ProcessName,Id,CPU -AutoSize

Write-Host ""
Write-Host "To start servers:" -ForegroundColor Yellow
Write-Host "  Backend:  python run.py" -ForegroundColor White
Write-Host "  Frontend: npm run dev" -ForegroundColor White
Write-Host "  Both:     python dev.py" -ForegroundColor White
