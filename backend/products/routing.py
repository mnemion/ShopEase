from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # ws://localhost:8000/ws/category-updates/ 경로로 오는 요청을 CategoryConsumer가 처리
    re_path(r'^ws/category-updates/$', consumers.CategoryConsumer.as_asgi()),
]