from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
# from .views_oauth import GoogleLoginDoneView, KakaoLoginDoneView, NaverLoginDoneView  # 제거
from .views import GoogleLoginView, KakaoLoginView, NaverLoginView
# from django.views.generic import TemplateView  # 사용 안 함

app_name = 'core'

# 라우터 생성
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'addresses', views.AddressViewSet, basename='address')

urlpatterns = [
    # ViewSet 라우트
    path('', include(router.urls)),
    
    # JWT 토큰 갱신
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 소셜 로그인 엔드포인트 (API 요청 받아 allauth로 보내는 역할, 유지)
    path('auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('auth/kakao/', KakaoLoginView.as_view(), name='kakao_login'),
    path('auth/naver/', NaverLoginView.as_view(), name='naver_login'),
]