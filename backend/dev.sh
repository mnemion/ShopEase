#!/bin/bash

# 가상환경 확인 및 활성화
if [ ! -d "venv" ]; then
    echo "가상환경을 생성합니다..."
    python -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 필요한 패키지 설치
echo "필요한 패키지를 설치합니다..."
pip install -r requirements.txt

# 마이그레이션 적용
echo "데이터베이스 마이그레이션을 적용합니다..."
python manage.py migrate

# 개발 서버 실행
echo "Django 개발 서버를 실행합니다..."
python manage.py runserver