# ShopEase 백엔드

ShopEase 백엔드는 Django와 Django REST Framework를 사용한 이커머스 플랫폼입니다.

## 환경 설정

### 필수 요구사항
- Python 3.10 이상
- pip 23.0 이상

### 설치 및 실행 방법

1. 가상환경 생성 및 활성화
   ```bash
   # Linux/macOS
   python -m venv venv
   source venv/bin/activate
   
   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

2. 패키지 설치
   ```bash
   pip install -r requirements.txt
   ```

3. 마이그레이션 실행
   ```bash
   python manage.py migrate
   ```

4. 개발 서버 실행
   ```bash
   # Linux/macOS
   ./dev.sh
   
   # Windows
   .\dev.bat
   # 또는
   .\dev.ps1
   ```

## Celery 작업 실행

### Linux/macOS 환경
Linux나 macOS 환경에서는 Redis가 필요합니다. Redis를 설치하고 실행한 후:

```bash
# Celery 워커 실행
./run_celery.sh

# Celery Beat 스케줄러 실행
./run_celery_beat.sh
```

### Windows 환경
Windows 환경에서는 두 가지 방법으로 Celery를 실행할 수 있습니다:

1. 기본 설정 (메모리 브로커 사용)
   ```
   # Celery 워커 실행
   .\run_celery.bat
   # 또는
   .\run_celery.ps1
   
   # Celery Beat 스케줄러 실행
   .\run_celery_beat.bat
   # 또는
   .\run_celery_beat.ps1
   ```
   
   이 방법은 개발 환경에서만 권장됩니다.

2. Redis 설치 (프로덕션 환경과 유사한 설정)
   - [Memurai](https://www.memurai.com/) 설치 (Windows용 Redis 호환 서버)
   - 또는 Docker를 사용하여 Redis 컨테이너 실행:
     ```
     docker run --name redis -p 6379:6379 -d redis
     ```
   - `.env` 파일에서 `CELERY_BROKER_URL`과 `CELERY_RESULT_BACKEND`를 설정

## 테스트 실행

```bash
# Linux/macOS
./run_tests.sh

# Windows
.\run_tests.bat
# 또는
.\run_tests.ps1
```