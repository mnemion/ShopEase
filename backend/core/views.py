from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, AddressSerializer, LoginSerializer, PasswordResetSerializer
from .models import Address
from django.shortcuts import render, redirect
from rest_framework import viewsets
from rest_framework.decorators import action
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.kakao.views import KakaoOAuth2Adapter
from allauth.socialaccount.providers.naver.views import NaverOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.http import HttpResponseRedirect, JsonResponse, HttpResponse
from django.urls import reverse
from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView, OAuth2LoginView
import jwt
import requests
import logging
from django.template.loader import render_to_string

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    """사용자 회원가입 API"""
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """사용자 프로필 조회/수정 API"""
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    """로그아웃 API - JWT 토큰 무효화"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class AddressListCreateView(generics.ListCreateAPIView):
    """배송지 목록 조회 및 생성 API"""
    serializer_class = AddressSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """배송지 상세 조회, 수정, 삭제 API"""
    serializer_class = AddressSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

class UserViewSet(viewsets.ModelViewSet):
    """
    사용자 CRUD API
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """현재 로그인한 사용자 정보 반환"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def register(self, request):
        """회원가입 API"""
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def login(self, request):
        """로그인 API"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """로그아웃 (클라이언트에서 토큰 삭제)"""
        # JWT 사용 시 서버에서는 별도 처리 불필요 (토큰 블랙리스트는 옵션)
        return Response({"detail": "로그아웃되었습니다."})
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def reset_password(self, request):
        """비밀번호 재설정 요청"""
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "비밀번호 재설정 이메일이 발송되었습니다."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AddressViewSet(viewsets.ModelViewSet):
    """
    주소 CRUD API
    """
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# 소셜 로그인 뷰
@method_decorator(csrf_exempt, name='dispatch')
class GoogleLoginView(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client

@method_decorator(csrf_exempt, name='dispatch')
class KakaoLoginView(SocialLoginView):
    adapter_class = KakaoOAuth2Adapter
    client_class = OAuth2Client

@method_decorator(csrf_exempt, name='dispatch')
class NaverLoginView(SocialLoginView):
    adapter_class = NaverOAuth2Adapter
    client_class = OAuth2Client

def social_login_callback_view(request):
    print("-" * 30)
    print("[social_login_callback_view] View started.")
    print(f"  Session Key: {request.session.session_key}")
    print(f"  All Session Data: {list(request.session.items())}") # 세션 전체 내용 출력
    jwt_auth = request.session.get('jwt_auth', None)
    print(f"  Value for 'jwt_auth' in session: {jwt_auth}")
    print("-" * 30)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')

    # 세션에서 JWT 토큰 가져오기
    jwt_auth = request.session.get('jwt_auth', {})
    access_token = jwt_auth.get('access', '')
    refresh_token = jwt_auth.get('refresh', '')

    # 사용자 정보도 추가로 전달 (디버깅 및 환영 메시지에 사용 가능)
    user_email = request.user.email if request.user.is_authenticated else ''
    session_key = request.session.session_key  # 디버깅용

    # 디버깅 로그 추가
    print(f"[social_login_callback_view] Rendering login_done.html")
    print(f"  User: {user_email}, Session Key: {session_key}")
    print(f"  Access Token found: {'Yes' if access_token else 'No'}")
    print(f"  Refresh Token found: {'Yes' if refresh_token else 'No'}")

    context = {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'frontend_url': frontend_url,
        'user_email': user_email,  # 템플릿 전달
        'session_key': session_key,  # 템플릿 전달
    }

    # 사용 후 세션에서 토큰 정보 삭제 (보안 강화)
    if 'jwt_auth' in request.session:
        request.session.modified = True
        request.session.save()
        del request.session['jwt_auth']
        print("[social_login_callback_view] JWT auth data removed from session.")

    return render(request, 'socialaccount/login_done.html', context)

def social_login_success(request):
    access_token = request.GET.get('access_token', '')
    refresh_token = request.GET.get('refresh_token', '')
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    context = {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'frontend_url': frontend_url,
    }
    html = render_to_string('socialaccount/login_done.html', context)
    return HttpResponse(html, content_type='text/html; charset=utf-8')