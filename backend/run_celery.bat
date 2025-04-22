@echo off
echo 가상환경을 활성화합니다...
call venv\Scripts\activate.bat

echo 환경 변수를 설정합니다...
set CELERY_BROKER_URL=memory://
set CELERY_RESULT_BACKEND=db+sqlite:///celery-results.sqlite

echo Celery 워커를 실행합니다...
celery -b memory:// --result-backend db+sqlite:///celery-results.sqlite -A shopease worker --loglevel=debug -P solo

pause 