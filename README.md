# ShopEase 온라인 쇼핑몰

React와 Django를 사용한 모던한 풀스택 온라인 쇼핑몰 프로젝트입니다.

## 주요 기능

- **사용자 관리**
  - 회원가입, 로그인 (JWT 인증)
  - 사용자 프로필 관리
  - 배송지 관리
- **상품 관리**
  - 카테고리 및 상품 조회
  - 필터링 및 검색 기능
  - 상품 리뷰 작성 및 평점 시스템
- **장바구니 시스템**
  - 상품 추가, 수량 변경, 삭제
  - 장바구니 요약 정보
- **주문 시스템**
  - 주문 생성 및 결제 처리
  - 주문 내역 관리
  - 주문 취소 기능
- **고급 기능**
  - Redis 캐싱
  - Celery 비동기 태스크 처리
  - 자동화된 이메일 알림
  - 주기적 태스크 스케줄링

## 사용 기술

### 백엔드
- **Python 3.11+**
- **Django 5.2** - 웹 프레임워크
- **Django REST Framework 3.16** - RESTful API 개발
- **Django REST Framework JWT 5.5** - JWT 인증
- **Django-filter 25.1** - 고급 필터링
- **Redis 5.2.1** - 캐싱 및 Celery 브로커
- **Celery 5.5.1** - 비동기 태스크 처리
- **PostgreSQL/SQLite** - 데이터베이스
- **Pytest 8.3.5** - 테스트 프레임워크
- **Coverage 7.8.0** - 테스트 커버리지

### 프론트엔드
- **React 18** - UI 라이브러리
- **React Router v6** - 클라이언트 라우팅
- **Context API** - 상태 관리
- **Axios** - HTTP 클라이언트
- **TailwindCSS** - 스타일링
- **React Toastify** - 알림 컴포넌트

## 보안 및 .gitignore
프로젝트에 민감 정보를 포함하는 파일(.env 등)과 빌드/종속성 폴더(node_modules/, build/ 등), IDE 설정 등을 Git에 커밋하지 않으려면, 프로젝트 루트에 `.gitignore` 파일을 만들고 아래 내용을 추가하세요:
```gitignore
.env
.env.*
.venv/
venv/
__pycache__/
node_modules/
build/
dist/
*.sqlite3
.DS_Store
Thumbs.db
.vscode/
.idea/
```

## 프로젝트 설정 및 실행 방법

### 사전 요구사항
- Python 3.11+ 설치
- Node.js 16+ 및 npm 설치
- Redis 서버 설치 (캐싱 및 Celery 브로커용)
- (선택) PostgreSQL 설치

### 백엔드 설정

1. 환경 설정
```bash
# 프로젝트 디렉토리로 이동
cd ShopEase/backend

# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 편집하여 필요한 값 설정
```

2. 개발 서버 실행 (Daphne ASGI 서버)
```bash
# 실행 권한 부여 (Linux/macOS)
chmod +x dev.sh
./dev.sh
```
```powershell
# Windows PowerShell
.\\dev_with_daphne.ps1
```
```bat
# Windows CMD
.\\dev_with_daphne.bat
```

3. 또는 수동으로 설정하기
```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows에서는 venv\\Scripts\\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 마이그레이션
python manage.py migrate

# 관리자 계정 생성
python manage.py createsuperuser

# 개발 서버 실행 (ASGI)
# Daphne 서버 사용 권장: daphne -v 2 -p 8000 shopease.asgi:application
# 또는 Django 개발 서버: python manage.py runserver
```

4. Celery 워커 실행 (비동기 태스크용)
```bash
# 새 터미널에서
chmod +x run_celery.sh
./run_celery.sh

# 또는 수동으로
source venv/bin/activate
celery -A shopease worker --loglevel=info
```

5. Celery Beat 실행 (주기적 태스크용)
```bash
# 새 터미널에서
chmod +x run_celery_beat.sh
./run_celery_beat.sh

# 또는 수동으로
source venv/bin/activate
celery -A shopease beat --loglevel=info
```

### 프론트엔드 설정

1. 패키지 설치
```bash
cd ShopEase/src
npm install
```

2. 개발 서버 실행
```bash
npm start
```

## 테스트 실행

```bash
# 백엔드 테스트 실행
cd ShopEase/backend
chmod +x run_tests.sh
./run_tests.sh

# 또는 수동으로
source venv/bin/activate
pytest
```

## 프로젝트 구조

```
ShopEase/
├── backend/                    # Django 백엔드 
│   ├── manage.py              # Django 관리 스크립트
│   ├── shopease/              # 메인 Django 프로젝트
│   │   ├── settings.py        # 프로젝트 설정
│   │   ├── urls.py            # URL 라우팅
│   │   ├── celery.py          # Celery 설정
│   ├── core/                  # 사용자 관리 앱
│   ├── products/              # 상품 관리 앱
│   │   ├── tasks.py           # 상품 관련 Celery 태스크
│   │   ├── tests.py           # 상품 앱 테스트
│   ├── orders/                # 주문 관리 앱
│   │   ├── tasks.py           # 주문 관련 Celery 태스크
│   │   ├── tests.py           # 주문 앱 테스트
│   ├── dev.sh                 # 개발 서버 실행 스크립트
│   ├── run_celery.sh          # Celery 워커 실행 스크립트
│   ├── run_celery_beat.sh     # Celery Beat 실행 스크립트
│   ├── run_tests.sh           # 테스트 실행 스크립트
│   └── requirements.txt       # 파이썬 패키지 의존성
└── src/                       # React 프론트엔드
    ├── public/                # 정적 파일
    ├── src/                   # 소스 코드
    │   ├── components/        # 재사용 컴포넌트
    │   ├── pages/             # 페이지 컴포넌트
    │   ├── api/               # API 통신 모듈
    │   ├── context/           # Context API
    │   ├── utils/             # 유틸리티 함수
    │   ├── App.js             # 메인 App 컴포넌트
    │   └── index.js           # 엔트리 포인트
    └── package.json           # npm 패키지 의존성
```

## 주요 URL 및 API 엔드포인트

### 관리자 인터페이스
- `/admin/` - Django 관리자 페이지

### API 문서
- `/swagger/` - Swagger API 문서
- `/redoc/` - ReDoc API 문서

### 사용자 관리 API
- `/api/users/register/` - 회원가입
- `/api/users/login/` - 로그인
- `/api/users/me/` - 내 정보 조회/수정
- `/api/users/addresses/` - 배송지 관리

### 상품 API
- `/api/products/` - 상품 목록/검색/필터링
- `/api/products/{id}/` - 상품 상세 정보
- `/api/products/categories/` - 카테고리 목록
- `/api/products/{id}/review/` - 상품 리뷰 작성

### 장바구니 및 주문 API
- `/api/orders/cart/` - 장바구니 관리
- `/api/orders/` - 주문 목록 조회
- `/api/orders/checkout/` - 결제 처리
- `/api/orders/{id}/cancel/` - 주문 취소

## 기여 방법

1. 이 저장소를 포크합니다.
2. 새 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경 사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.