@echo off
echo 가상환경을 활성화합니다...
call venv\Scripts\activate.bat

echo 주의: 이 작업은 데이터베이스를 초기화합니다. 모든 데이터가 삭제됩니다.
set /p CONFIRM=계속하시겠습니까? (y/n): 
if /i "%CONFIRM%" neq "y" goto end

echo 데이터베이스 파일을 백업합니다...
if exist db.sqlite3 copy db.sqlite3 db.sqlite3.bak

echo 데이터베이스 파일을 삭제합니다...
if exist db.sqlite3 del db.sqlite3

echo 마이그레이션 파일을 생성합니다...
python manage.py makemigrations

echo 마이그레이션을 적용합니다...
python manage.py migrate

echo 데이터베이스가 초기화되었습니다.

:end
pause 