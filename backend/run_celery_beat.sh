#!/bin/bash

# 가상환경 활성화
source venv/bin/activate

# Celery Beat 실행
echo "Celery Beat 스케줄러를 실행합니다..."
celery -A shopease beat --loglevel=info