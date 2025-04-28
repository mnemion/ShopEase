from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.views.generic import TemplateView
from core.views import social_login_callback_view

# 사이트 보기 링크만 덮어쓰기
admin.site.site_url = settings.FRONTEND_URL

schema_view = get_schema_view(
   openapi.Info(
      title="ShopEase API",
      default_version='v1',
      description="ShopEase 온라인 쇼핑몰 API",
      terms_of_service="https://www.shopease.com/terms/",
      contact=openapi.Contact(email="contact@shopease.com"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # 1) social-login-success: 무조건 최우선
    path(
        "accounts/social-login-success/",
        social_login_callback_view,
        name="social_login_success"
    ),

    # 2) allauth / dj-rest-auth / dj-rest-auth.registration
    path("accounts/", include("allauth.urls")),
    path("accounts/", include("dj_rest_auth.urls")),
    path("accounts/", include("dj_rest_auth.registration.urls")),

    # 3) Removed custom social login callback views
    # path('accounts/google/login/callback/', FixedGoogleCallbackView.as_view(), name='google_callback'),
    # path('accounts/kakao/login/callback/',  FixedKakaoCallbackView.as_view(),  name='kakao_callback'),
    # path('accounts/naver/login/callback/',  FixedNaverCallbackView.as_view(),  name='naver_callback'),

    # 4) 나머지 API (core/router)
    path("api/", include("core.urls")),  # /api/users/, /api/users/me/ 등

    path('admin/', admin.site.urls),

    # API 앱 라우트 (core.urls는 /api/ 아래로만 둔다)
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),

    # API 문서화
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # 디버그 툴바
    path('__debug__/', include('debug_toolbar.urls')),
]

# 개발 환경에서만 미디어 파일 서빙 및 디버그 툴바 활성화
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    # 디버그 툴바
    try:
        import debug_toolbar
        urlpatterns += [
            path('__debug__/', include(debug_toolbar.urls)),
        ]
    except ImportError:
        pass