# Celery 설정 임포트 (개발 환경에서도 오류 없이 작동하도록)
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    # Redis 관련 오류 발생 시 조용히 넘어감
    __all__ = ()