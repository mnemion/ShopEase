#!/bin/bash

# 가상환경 활성화
source venv/bin/activate

# pytest 실행
echo "테스트를 실행합니다..."
pytest

# 코드 커버리지 보고서 생성
echo "코드 커버리지 보고서를 생성합니다..."
coverage run -m pytest
coverage report
coverage html

echo "HTML 커버리지 보고서가 생성되었습니다. htmlcov/index.html 파일을 브라우저에서 열어 확인하세요."