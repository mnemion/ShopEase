# 가상환경 확인 및 생성
if (-not (Test-Path "venv")) {
    Write-Host "가상환경을 생성합니다..." -ForegroundColor Green
    python -m venv venv
}

# 가상환경 활성화
Write-Host "가상환경을 활성화합니다..." -ForegroundColor Green
& ".\venv\Scripts\Activate.ps1"

# 필요한 패키지 설치
Write-Host "필요한 패키지를 설치합니다..." -ForegroundColor Green
pip install -r requirements.txt

# 마이그레이션 파일 생성
Write-Host "마이그레이션 파일을 생성합니다..." -ForegroundColor Green
python manage.py makemigrations

# 마이그레이션 적용
Write-Host "데이터베이스 마이그레이션을 적용합니다..." -ForegroundColor Green
python manage.py migrate

# 개발 서버 실행
Write-Host "Django 개발 서버를 실행합니다..." -ForegroundColor Green
python manage.py runserver 