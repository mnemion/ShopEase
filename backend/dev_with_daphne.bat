@echo off
echo ShopEase 개발 서버 시작 (daphne)
echo =====================================

echo 가상 환경 활성화...
call venv\Scripts\activate

echo DJANGO_SETTINGS_MODULE 환경 변수 설정...
set DJANGO_SETTINGS_MODULE=shopease.settings

echo 로깅 레벨 설정 (개발용)...
set DJANGO_LOG_LEVEL=DEBUG

echo Daphne 서버 시작 (ASGI - WebSocket 지원)...
echo WebSocket 주소: ws://localhost:8000/ws/category-updates/
daphne -b 0.0.0.0 -v 2 -p 8000 shopease.asgi:application

echo =====================================
echo 서버가 종료되었습니다.
pause