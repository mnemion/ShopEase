# 가상환경 활성화
& ".\venv\Scripts\Activate.ps1"

# 환경 변수 설정
Write-Host "환경 변수를 설정합니다..." -ForegroundColor Green
$env:CELERY_BROKER_URL = "memory://"
$env:CELERY_RESULT_BACKEND = "db+sqlite:///celery-results.sqlite"

# Celery Beat 스케줄러 실행
Write-Host "Celery Beat 스케줄러를 실행합니다..." -ForegroundColor Green
celery -b memory:// --result-backend db+sqlite:///celery-results.sqlite -A shopease beat --loglevel=debug 