from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from allauth.account.signals import user_logged_in
from rest_framework_simplejwt.tokens import RefreshToken
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """
    사용자 생성 시 환영 이메일 전송
    """
    if created:  # 새로운 사용자가 생성된 경우에만 실행
        try:
            send_mail(
                subject='ShopEase에 가입하신 것을 환영합니다!',
                message=f'''안녕하세요 {instance.name or instance.email}님,

ShopEase에 가입해주셔서 감사합니다!
이제 다양한 상품을 쇼핑하고 특별한 혜택을 누려보세요.

문의사항이 있으시면 언제든지 고객센터로 문의해주세요.

감사합니다,
ShopEase 드림''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.email],
                fail_silently=True,  # 이메일 전송 실패해도 에러 발생하지 않음
            )
        except Exception as e:
            # 로깅을 통해 이메일 전송 실패 기록
            print(f"환영 이메일 전송 실패: {str(e)}")

# user_logged_in 시그널 수신 (소셜/일반 로그인 모두 포함)
@receiver(user_logged_in)
def handle_user_logged_in(sender, request, user, **kwargs):
    """
    사용자가 성공적으로 로그인했을 때 추가 작업 수행 (예: 로깅)
    API 기반 소셜 로그인은 응답에서 JWT를 직접 반환하므로 세션 저장은 불필요.
    """
    logger.info(f"User logged in signal received for user: {user.email}")
    
    # --- 아래 JWT 생성 및 세션 저장 로직은 주석 처리 ---
    # try:
    #     # JWT 토큰 생성
    #     refresh = RefreshToken.for_user(user)
    #     jwt_auth_data = {
    #         'refresh': str(refresh),
    #         'access': str(refresh.access_token),
    #     }
    #     # 현재 request의 세션에 저장
    #     request.session['jwt_auth'] = jwt_auth_data
    #     request.session.modified = True  # 세션 변경 알림
    #     request.session.save()         # 세션 저장
    #     logger.info(f"JWT tokens added to session for user {user.email}. Session key: {request.session.session_key}")
    #     logger.debug(f"  Session data now includes 'jwt_auth': {request.session.get('jwt_auth')}") # 저장된 값 확인
    # except Exception as e:
    #     logger.error(f"Error setting JWT token in session for user {user.email}: {e}", exc_info=True) # 오류 로깅