@echo off

REM 가상환경 확인 및 생성
if not exist venv (
    echo 가상환경을 생성합니다...
    python -m venv venv
)

REM 가상환경 활성화
echo 가상환경을 활성화합니다...
call venv\Scripts\activate.bat

REM 필요한 패키지 설치
echo 필요한 패키지를 설치합니다...
pip install -r requirements.txt

REM 마이그레이션 파일 생성
echo 마이그레이션 파일을 생성합니다...
python manage.py makemigrations

REM 마이그레이션 적용
echo 데이터베이스 마이그레이션을 적용합니다...
python manage.py migrate

REM 개발 서버 실행
echo Django 개발 서버를 실행합니다...
python manage.py runserver

pause