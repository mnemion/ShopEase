#!/bin/bash

# 가상환경 활성화
source venv/bin/activate

# Celery 워커 실행
echo "Celery 워커를 실행합니다..."
celery -A shopease worker --loglevel=info