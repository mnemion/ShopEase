import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import platform
from corsheaders.defaults import default_headers

# .env 파일 로드
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,localhost:8000').split(',')

# Application definition
INSTALLED_APPS = [
    'daphne',  # 최상단에 추가
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',  # django-allauth에 필요
    
    # 써드파티 앱
    'rest_framework',
    'rest_framework.authtoken',  # dj-rest-auth에 필요
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_yasg',
    'django_filters',  # 고급 필터링
    'debug_toolbar',   # 디버깅 도구 (개발용)
    'django_extensions',
    'channels',  # Channels 라이브러리 추가
    
    # 소셜 로그인 관련 앱
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.kakao',
    'allauth.socialaccount.providers.naver',
    'dj_rest_auth',
    'dj_rest_auth.registration',
    
    # 커스텀 앱
    'core',
    'products',
    'orders',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS 미들웨어
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'debug_toolbar.middleware.DebugToolbarMiddleware',  # 디버그 툴바 (개발용)
    'allauth.account.middleware.AccountMiddleware',  # django-allauth 미들웨어
    'django.contrib.sites.middleware.CurrentSiteMiddleware',  # 현재 Site 자동 설정
]

# django.contrib.sites 프레임워크 필요 (allauth 요구사항)
SITE_ID = 1

# 디버그 툴바 설정
INTERNAL_IPS = [
    '127.0.0.1',
]

DEBUG_TOOLBAR_CONFIG = {
    'SHOW_TOOLBAR_CALLBACK': lambda request: not request.path.startswith('/accounts/social-login-success/'),
}

ROOT_URLCONF = 'shopease.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],  # 소셜 로그인 템플릿 디렉토리 추가
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'shopease.wsgi.application'
# ASGI 설정 추가
ASGI_APPLICATION = 'shopease.asgi.application'

# Database
# 기본은 SQLite, 프로덕션에서는 PostgreSQL 등으로 변경
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Internationalization
LANGUAGE_CODE = 'ko-kr'  # 한국어 설정
TIME_ZONE = 'Asia/Seoul'  # 한국 시간대 설정
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static', 'css'),  # frontend에서 빌드된 css 경로
]

# 미디어 파일 설정 (사용자 업로드)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'core.User'

# REST Framework 설정
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'dj_rest_auth.jwt_auth.JWTCookieAuthentication',  # dj-rest-auth JWT 인증 추가
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

# JWT 설정
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,

    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,

    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',

    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',

    'JTI_CLAIM': 'jti',
}

# CORS 설정
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False

# CORS 허용 헤더에 cache-control 추가
CORS_ALLOW_HEADERS = list(default_headers) + [
    'cache-control',
    'pragma',
    'expires',
]

# WebSocket CORS 설정 추가
CORS_ALLOW_ALL_ORIGINS = DEBUG  # 개발 환경에서만 모든 오리진 허용 (True)
CORS_URLS_REGEX = r'^/(api|ws)/.*$'  # API와 WebSocket 경로에만 CORS 적용

# 이메일 설정
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # 개발용
EMAIL_HOST = os.getenv('EMAIL_HOST', '')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True').lower() == 'true'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@shopease.com')

# 로깅 설정
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/django.log'),
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# Allauth 설정
ACCOUNT_USER_MODEL_USERNAME_FIELD = None   # allauth에 알림
ACCOUNT_USERNAME_REQUIRED = False          # username 필수 아님
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']
ACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_ADAPTER = 'core.adapters.CustomSocialAccountAdapter'  # 커스텀 어댑터
SOCIALACCOUNT_AUTO_SIGNUP = True  # 소셜 계정 정보로 자동 회원가입
SOCIALACCOUNT_EMAIL_VERIFICATION = ACCOUNT_EMAIL_VERIFICATION
SOCIALACCOUNT_QUERY_EMAIL = True  # 이메일 정보 요청
SOCIALACCOUNT_STORE_TOKENS = True  # 소셜 프로바이더 토큰 저장
SOCIALACCOUNT_LOGIN_ON_GET = True  # 소셜 로그인 시 중간 확인 페이지 건너뛰기

# dj-rest-auth 설정
REST_AUTH = {
    'USE_JWT': True,  # JWT 사용
    'JWT_AUTH_HTTPONLY': False,  # 리프레시 토큰을 JS에서 접근 가능하게 함
    'SESSION_LOGIN': False,  # API 기반이므로 세션 로그인 비활성화
    'REGISTER_SERIALIZER': 'core.serializers.RegisterSerializer',
}

# 수정할 부분: FRONTEND_URL 추가
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# 소셜 프로바이더 설정 수정
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    },
    'kakao': {
        'AUTH_PARAMS': {'prompt': 'select_account'},
    },
    'naver': {
        'AUTH_PARAMS': {'auth_type': 'reprompt'},
    }
}

# 인증 백엔드 설정
AUTHENTICATION_BACKENDS = (
    # Django 기본 인증 백엔드
    'django.contrib.auth.backends.ModelBackend',
    # allauth 인증 백엔드
    'allauth.account.auth_backends.AuthenticationBackend',
)

# 소셜 로그인 리디렉션 URL 설정
LOGIN_REDIRECT_URL = '/accounts/social-login-success/'

# WebSocket 개발 환경용 InMemoryChannelLayer 설정 추가
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer'
    }
}

# 팝업 → 부모창 opener 관계를 유지하려면… 
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin-allow-popups"