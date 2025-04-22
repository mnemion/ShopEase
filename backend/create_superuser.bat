@echo off
echo 가상환경을 활성화합니다...
call venv\Scripts\activate.bat

echo Django 관리자 계정을 생성합니다...
python manage.py createsuperuser

pause 