@echo off
echo 가상환경을 활성화합니다...
call venv\Scripts\activate.bat

echo 마이그레이션 파일을 생성합니다...
python manage.py makemigrations

echo 데이터베이스 마이그레이션을 적용합니다...
python manage.py migrate

pause 