# 가상환경 활성화
Write-Host "가상환경을 활성화합니다..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

# 마이그레이션 파일 생성
Write-Host "마이그레이션 파일을 생성합니다..." -ForegroundColor Green
python manage.py makemigrations

# 마이그레이션 적용
Write-Host "데이터베이스 마이그레이션을 적용합니다..." -ForegroundColor Green
python manage.py migrate 