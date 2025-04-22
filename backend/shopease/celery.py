import os
from celery import Celery
from celery.schedules import crontab
import platform

# Windows 환경에서는 환경 변수 직접 설정 (settings 로드 전)
if platform.system() == 'Windows':
    os.environ['CELERY_BROKER_URL'] = 'memory://'
    os.environ['CELERY_RESULT_BACKEND'] = 'db+sqlite:///celery-results.sqlite'
    print('Windows 환경에서 메모리 브로커로 환경 변수를 설정합니다.')

# Django 설정 모듈 설정
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shopease.settings')

app = Celery('shopease')

# namespace='CELERY'는 모든 셀러리 관련 설정에 'CELERY_' 접두사가 붙음을 의미
app.config_from_object('django.conf:settings', namespace='CELERY')

# Windows 환경에서는 직접 브로커 설정 변경
if platform.system() == 'Windows':
    app.conf.broker_url = 'memory://'
    app.conf.result_backend = 'db+sqlite:///celery-results.sqlite'
    print('Windows 환경에서 메모리 브로커로 설정합니다.')

# 등록된 앱에서 task 모듈을 자동으로 불러옴
app.autodiscover_tasks()

# 주기적 태스크 설정
app.conf.beat_schedule = {
    # 방치된 장바구니 처리 (매일 자정에 실행)
    'process-abandoned-carts': {
        'task': 'orders.tasks.process_abandoned_carts',
        'schedule': crontab(hour=0, minute=0),
        'args': (24,),  # 24시간 이상 방치된 장바구니 처리
    },
    # 오래된 주문 데이터 정리 (매주 일요일 새벽 3시에 실행)
    'clean-old-orders': {
        'task': 'orders.tasks.clean_old_orders',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
        'args': (90,),  # 90일 이상 된 주문 처리
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')