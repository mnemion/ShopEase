"""
ASGI config for shopease project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'shopease.settings')

# 기본 Django ASGI 애플리케이션 (HTTP 요청 처리)
# Django 앱이 완전히 로드된 후에 채널 관련 임포트 진행
django_asgi_app = get_asgi_application()

# 채널 관련 임포트는 반드시 Django 앱이 로드된 후에 실행되어야 함
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import OriginValidator, AllowedHostsOriginValidator
import products.routing  # products 앱의 라우팅 임포트

application = ProtocolTypeRouter({
    "http": django_asgi_app,  # HTTP 요청은 기존 Django 앱이 처리
    "websocket": AllowedHostsOriginValidator(
        OriginValidator(
            AuthMiddlewareStack(
                URLRouter(
                    # 여기에 각 앱의 WebSocket 라우팅을 추가
                    products.routing.websocket_urlpatterns
                )
            ),
            ["http://localhost:3000", "http://127.0.0.1:3000"]
        )
    ),
})