@echo off
echo 가상환경을 활성화합니다...
call venv\Scripts\activate.bat

echo 테스트를 실행합니다...
pytest

echo 코드 커버리지 보고서를 생성합니다...
coverage run -m pytest
coverage report
coverage html

echo HTML 커버리지 보고서가 생성되었습니다. htmlcov\index.html 파일을 브라우저에서 열어 확인하세요.

pause 