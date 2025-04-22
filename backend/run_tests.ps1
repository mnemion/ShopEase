# 가상환경 활성화
& ".\venv\Scripts\Activate.ps1"

# pytest 실행
Write-Host "테스트를 실행합니다..." -ForegroundColor Green
pytest

# 코드 커버리지 보고서 생성
Write-Host "코드 커버리지 보고서를 생성합니다..." -ForegroundColor Green
coverage run -m pytest
coverage report
coverage html

Write-Host "HTML 커버리지 보고서가 생성되었습니다. htmlcov\index.html 파일을 브라우저에서 열어 확인하세요." -ForegroundColor Cyan 