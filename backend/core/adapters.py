from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.contrib.auth import get_user_model
from allauth.socialaccount.providers import registry
from django.core.exceptions import ImproperlyConfigured
from allauth.socialaccount.models import SocialApp
from django.contrib.sites.shortcuts import get_current_site

User = get_user_model()

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    소셜 로그인 커스텀 어댑터
    """
    def save_user(self, request, sociallogin, form=None):
        """
        소셜 로그인 사용자를 저장할 때 호출
        사용자 프로필 필드를 소셜 데이터로 채움
        """
        user = super().save_user(request, sociallogin, form)
        social_data = sociallogin.account.extra_data

        # 이름 필드 채우기 (가능하다면)
        if not user.name:
            if sociallogin.account.provider == 'google':
                user.name = social_data.get('name', '')
            elif sociallogin.account.provider == 'kakao':
                user.name = social_data.get('properties', {}).get('nickname', '')
            elif sociallogin.account.provider == 'naver':
                user.name = social_data.get('name', '')

        # 전화번호 필드 채우기 (가능하다면, 일부 제공업체는 제공하지 않음)
        # if not user.phone:
        #     if sociallogin.account.provider == 'kakao':
        #          phone_number = social_data.get('kakao_account', {}).get('phone_number', '')
        #          if phone_number:
        #              user.phone = phone_number
        #     elif sociallogin.account.provider == 'naver':
        #          user.phone = social_data.get('mobile', '')

        user.save()
        print(f"[Adapter save_user] User saved: {user.email}")
        return user

    def pre_social_login(self, request, sociallogin):
        """
        소셜 로그인이 완료되기 직전에 호출
        기존 이메일 사용자와 연결하는 로직 추가
        """
        # 이미 연결된 경우
        if sociallogin.is_existing:
            print(f"[Adapter pre_social_login] Existing user: {sociallogin.user.email}")
            return

        # 소셜 계정에 이메일이 있는 경우
        if 'email' in sociallogin.account.extra_data:
            email = sociallogin.account.extra_data['email'].lower()
            try:
                existing_user = User.objects.get(email=email)
                sociallogin.connect(request, existing_user)
                print(f"[Adapter pre_social_login] Connected existing user: {existing_user.email}")
            except User.DoesNotExist:
                pass
        print(f"[Adapter pre_social_login] Completed pre-login checks.")
    
    def get_app(self, request, provider, client_id=None):
        """
        특정 provider와 client_id에 맞는 SocialApp을 가져오는 메서드 재정의
        여러 객체가 조회될 경우 첫 번째 것을 반환
        """
        apps = self.list_apps(request, provider=provider, client_id=client_id)
        if not apps:
            raise SocialApp.DoesNotExist("No social app configured for site %s, provider %s, client_id %s" % 
                                         (getattr(request, 'site', None), provider, client_id))
        # 현재 활성 사이트에 연결된 앱을 찾음
        current_site = get_current_site(request)
        for app in apps:
            if current_site.id in list(app.sites.values_list('id', flat=True)):
                return app
        # 활성 사이트에 연결된 앱이 없으면 첫 번째 반환
        return apps[0]
                
    def get_provider(self, request, provider, client_id=None):
        """
        provider 객체를 가져오는 메서드 재정의
        Provider에 필요한 메서드들을 동적으로 추가
        """
        provider_class = registry.get_class(provider)
        if provider_class is None or provider_class.uses_apps:
            app = self.get_app(request, provider=provider, client_id=client_id)
            if not provider_class:
                provider_class = registry.get_class(app.provider)
            if not provider_class:
                raise ImproperlyConfigured(f"unknown provider: {app.provider}")
            provider_instance = provider_class(request, app=app)
            
            # Provider에 get_app 메서드 동적 추가
            if not hasattr(provider_instance, 'get_app'):
                def get_app(self, request=None):
                    return app
                setattr(provider_instance.__class__, 'get_app', get_app)
                
                # Provider에 get_client 메서드 동적 추가
                if not hasattr(provider_instance, 'get_client'):
                    def get_client(self, request, app=None):
                        if app is None:
                            app = self.get_app(request)
                        from allauth.socialaccount.providers.oauth2.client import OAuth2Client
                        
                        # OAuth2Client 객체 생성 후 속성 설정
                        client = OAuth2Client(
                            request,
                            app.client_id,
                            app.secret,
                            None,  # access_token_url은 나중에 설정
                            None,  # authorize_url도 나중에 설정
                            None,  # profile_url 대신 None 사용
                        )
                        
                        # 제공자별로 필요한 URL 속성 확인
                        provider_class_name = self.__class__.__name__
                        
                        # 각 제공자별 URL 직접 설정
                        if provider_class_name == 'GoogleProvider':
                            client.access_token_url = 'https://oauth2.googleapis.com/token'
                            client.authorize_url = 'https://accounts.google.com/o/oauth2/v2/auth'
                        elif provider_class_name == 'KakaoProvider':
                            client.access_token_url = 'https://kauth.kakao.com/oauth/token'
                            client.authorize_url = 'https://kauth.kakao.com/oauth/authorize'
                        elif provider_class_name == 'NaverProvider':
                            client.access_token_url = 'https://nid.naver.com/oauth2.0/token'
                            client.authorize_url = 'https://nid.naver.com/oauth2.0/authorize'
                        else:
                            # 기본값 - 속성이 있으면 사용
                            client.access_token_url = getattr(self, 'access_token_url', None)
                            client.authorize_url = getattr(self, 'authorize_url', None)
                            
                        # 클라이언트에 provider 참조 추가
                        client.provider = self
                            
                        return client
                    setattr(provider_instance.__class__, 'get_client', get_client)
                
            return provider_instance
        elif provider_class and not provider_class.uses_apps:
            provider_instance = provider_class(request, app=None)
            
            # Provider에 get_app 메서드 동적 추가
            if not hasattr(provider_instance, 'get_app'):
                def get_app(self, request=None):
                    return app
                setattr(provider_instance.__class__, 'get_app', get_app)
                
                # Provider에 get_client 메서드 동적 추가
                if not hasattr(provider_instance, 'get_client'):
                    def get_client(self, request, app=None):
                        if app is None:
                            app = self.get_app(request)
                        from allauth.socialaccount.providers.oauth2.client import OAuth2Client
                        
                        # OAuth2Client 객체 생성 후 속성 설정
                        client = OAuth2Client(
                            request,
                            app.client_id,
                            app.secret,
                            None,  # access_token_url은 나중에 설정
                            None,  # authorize_url도 나중에 설정
                            None,  # profile_url 대신 None 사용
                        )
                        
                        # 제공자별로 필요한 URL 속성 확인
                        provider_class_name = self.__class__.__name__
                        
                        # 각 제공자별 URL 직접 설정
                        if provider_class_name == 'GoogleProvider':
                            client.access_token_url = 'https://oauth2.googleapis.com/token'
                            client.authorize_url = 'https://accounts.google.com/o/oauth2/v2/auth'
                        elif provider_class_name == 'KakaoProvider':
                            client.access_token_url = 'https://kauth.kakao.com/oauth/token'
                            client.authorize_url = 'https://kauth.kakao.com/oauth/authorize'
                        elif provider_class_name == 'NaverProvider':
                            client.access_token_url = 'https://nid.naver.com/oauth2.0/token'
                            client.authorize_url = 'https://nid.naver.com/oauth2.0/authorize'
                        else:
                            # 기본값 - 속성이 있으면 사용
                            client.access_token_url = getattr(self, 'access_token_url', None)
                            client.authorize_url = getattr(self, 'authorize_url', None)
                        
                        # 클라이언트에 provider 참조 추가
                        client.provider = self
                            
                        return client
                    setattr(provider_instance.__class__, 'get_client', get_client)
                
            return provider_instance
        else:
            raise ImproperlyConfigured(f"unknown provider: {provider}")