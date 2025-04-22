Write-Host "ShopEase 개발 서버 시작 (daphne)" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# 가상환경 활성화
Write-Host "가상 환경 활성화..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
} elseif (Test-Path ".venv\Scripts\Activate.ps1") {
    . .\.venv\Scripts\Activate.ps1
} else {
    Write-Host "가상 환경을 찾을 수 없습니다." -ForegroundColor Red
    exit
}

# 환경 변수 설정
Write-Host "DJANGO_SETTINGS_MODULE 환경 변수 설정..." -ForegroundColor Yellow
$env:DJANGO_SETTINGS_MODULE = "shopease.settings"

# 로깅 레벨 설정 (개발 중에는 디버그 레벨로)
$env:DJANGO_LOG_LEVEL = "DEBUG"

# Daphne 서버 시작 (verbose 모드로 실행하여 더 많은 정보 출력)
Write-Host "Daphne 서버 시작 (ASGI - WebSocket 지원)..." -ForegroundColor Green
Write-Host "WebSocket 주소: ws://localhost:8000/ws/category-updates/" -ForegroundColor Cyan

daphne -b 0.0.0.0 -v 2 -p 8000 shopease.asgi:application

Write-Host "=====================================" -ForegroundColor Green
Write-Host "서버가 종료되었습니다." -ForegroundColor Yellow
Read-Host "계속하려면 Enter 키를 누르세요..." 