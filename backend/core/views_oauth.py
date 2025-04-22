# All code in this file is now commented out or removed as we're switching to the dj-rest-auth API-based social login flow.
# The Fixed...CallbackView classes and related customizations are no longer needed.

"""
from allauth.socialaccount.models import SocialLogin as _SocialLogin
if not hasattr(_SocialLogin, "verify_and_unstash_state"):
    @classmethod
    def _verify_and_unstash_state(cls, request, *args, **kwargs):
        print("DEBUG: Using patched _verify_and_unstash_state (no compare)")
        return cls.unstash_state(request)
    _SocialLogin.verify_and_unstash_state = _verify_and_unstash_state

from allauth.socialaccount.models import SocialLogin
import allauth.socialaccount.providers.oauth2.views as oauth2_views
if not hasattr(oauth2_views, "SocialLogin"):
    oauth2_views.SocialLogin = SocialLogin

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView
from allauth.socialaccount.providers.kakao.views import KakaoOAuth2Adapter
from allauth.socialaccount.providers.naver.views import NaverOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Error
from allauth.socialaccount import app_settings
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.http import urlencode
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.exceptions import PermissionDenied
from django.views.generic import View
from django.shortcuts import render, redirect
from django.conf import settings
from .views import social_login_callback_view
import logging

logger = logging.getLogger(__name__)

# --- SocialLogin 모델에 verify_and_unstash_state 메소드 추가 (비교 로직 포함) ---
if not hasattr(SocialLogin, "verify_and_unstash_state"):
    logger.info("Dynamically adding verify_and_unstash_state method to SocialLogin class.")
    @classmethod
    def _verify_and_unstash_state(cls, request, state):
        try:
            expected = cls.unstash_state(request)
            logger.debug(f"  Unstashed state from session: {expected}")
            logger.debug(f"  State received from callback: {state}")
            if expected != state:
                logger.error("OAuth2 state mismatch!")
                raise PermissionDenied("OAuth2 state mismatch")
            return state
        except KeyError:
            logger.error("Could not find state in session ('socialaccount_state' key missing?).")
            raise PermissionDenied("State missing from session.")
        except Exception as e:
            logger.error(f"Error during state verification: {e}", exc_info=True)
            raise PermissionDenied("State verification failed.")
    SocialLogin.verify_and_unstash_state = _verify_and_unstash_state
else:
    logger.info("verify_and_unstash_state method already exists on SocialLogin class.")

# --- OAuth2Adapter 관련 패치 복원 (get_state_from_request) ---
from allauth.socialaccount.providers.oauth2.views import OAuth2Adapter
if not hasattr(OAuth2Adapter, "get_state_from_request"):
    logger.info("Dynamically adding get_state_from_request method to OAuth2Adapter class.")
    def _get_state_from_request(self, request):
         state = SocialLogin.state_from_request(request)
         logger.debug(f"  Getting state from request using state_from_request: {state}")
         return state
    OAuth2Adapter.get_state_from_request = _get_state_from_request
else:
    logger.info("get_state_from_request method already exists on OAuth2Adapter class.")

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.kakao.views import KakaoOAuth2Adapter
from allauth.socialaccount.providers.naver.views import NaverOAuth2Adapter

class FixedGoogleCallbackView(OAuth2CallbackView, View):
    adapter_class = GoogleOAuth2Adapter

    def dispatch(self, request, *args, **kwargs):
        self.request = request
        # self.adapter = self.adapter_class(request)  # Removed to allow settings.SOCIALACCOUNT_ADAPTER
        return super().dispatch(request, *args, **kwargs)

class FixedKakaoCallbackView(OAuth2CallbackView, View):
    adapter_class = KakaoOAuth2Adapter

    def dispatch(self, request, *args, **kwargs):
        self.request = request
        # self.adapter = self.adapter_class(request)  # Removed to allow settings.SOCIALACCOUNT_ADAPTER
        return super().dispatch(request, *args, **kwargs)

class FixedNaverCallbackView(OAuth2CallbackView, View):
    adapter_class = NaverOAuth2Adapter

    def dispatch(self, request, *args, **kwargs):
        self.request = request
        # self.adapter = self.adapter_class(request)  # Removed to allow settings.SOCIALACCOUNT_ADAPTER
        return super().dispatch(request, *args, **kwargs)

# Optionally keep or comment out these legacy views:
# class GoogleLoginDoneView(View):
#     def get(self, request, *args, **kwargs):
#         # return social_login_callback_view(request, provider='google')
#         pass
#
# class KakaoLoginDoneView(View):
#     def get(self, request, *args, **kwargs):
#         # return social_login_callback_view(request, provider='kakao')
#         pass
#
# class NaverLoginDoneView(View):
#     def get(self, request, *args, **kwargs):
#         # return social_login_callback_view(request, provider='naver')
#         pass
"""