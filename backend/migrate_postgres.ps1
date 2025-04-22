# 가상환경 활성화
Write-Host "가상환경을 활성화합니다..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

# PostgreSQL 데이터베이스에 마이그레이션 적용
Write-Host "PostgreSQL 데이터베이스에 마이그레이션을 적용합니다..." -ForegroundColor Green
Write-Host "마이그레이션 파일을 생성합니다..." -ForegroundColor Green
python manage.py makemigrations

Write-Host "마이그레이션을 적용합니다..." -ForegroundColor Green
python manage.py migrate

Write-Host "PostgreSQL 데이터베이스 설정이 완료되었습니다." -ForegroundColor Cyan 