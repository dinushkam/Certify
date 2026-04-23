# CertVerify Sri Lanka - Master Startup Script
Write-Host "Starting CertVerify Sri Lanka System..." -ForegroundColor Cyan

# Start Hardhat Local Blockchain
Write-Host "`n[1/3] Starting Blockchain Node..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList {
    Set-Location "C:\Users\User\Desktop\Certfy\blockchain"
    npx hardhat node
} -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Backend
Write-Host "[2/3] Starting Backend API..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList {
    Set-Location "C:\Users\User\Desktop\Certfy"
    .\venv\Scripts\activate
    Set-Location backend
    uvicorn main:app --reload
} -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[3/3] Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList {
    Set-Location "C:\Users\User\Desktop\Certfy\frontend"
    npm run dev
} -WindowStyle Normal

Write-Host "`nAll services starting!" -ForegroundColor Green
Write-Host "Blockchain:  http://127.0.0.1:8545" -ForegroundColor White
Write-Host "Backend API: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "API Docs:    http://127.0.0.1:8000/docs" -ForegroundColor White