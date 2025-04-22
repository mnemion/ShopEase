from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager, Group, Permission
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    """커스텀 사용자 매니저 - 이메일을 사용자명으로 사용"""
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('이메일은 필수입니다.'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    """커스텀 사용자 모델 - 사용자명 대신 이메일 사용"""
    username = None  # username 필드 제거
    email = models.EmailField(_('이메일 주소'), unique=True)
    name = models.CharField(_('이름'), max_length=150, blank=True)
    phone = models.CharField(_('전화번호'), max_length=15, blank=True)
    
    USERNAME_FIELD = 'email'  # 로그인 시 이메일 사용
    REQUIRED_FIELDS = []  # 필수 입력 필드
    
    objects = UserManager()
    
    # Override default M2M fields to avoid reverse accessor clashes with auth.User
    groups = models.ManyToManyField(
        Group,
        related_name='core_user_set',
        blank=True,
        verbose_name=_('groups'),
        help_text=_('The groups this user belongs to.'),
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='core_user_user_permissions',
        blank=True,
        verbose_name=_('user permissions'),
        help_text=_('Specific permissions for this user.'),
        related_query_name='user',
    )
    
    def __str__(self):
        return self.email

class Address(models.Model):
    """사용자 배송지 주소 모델"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    name = models.CharField(_('배송지명'), max_length=100)
    recipient = models.CharField(_('수령인'), max_length=100)
    phone = models.CharField(_('연락처'), max_length=15)
    zip_code = models.CharField(_('우편번호'), max_length=10)
    address1 = models.CharField(_('기본주소'), max_length=200)
    address2 = models.CharField(_('상세주소'), max_length=200, blank=True)
    is_default = models.BooleanField(_('기본 배송지'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _('배송지')
        verbose_name_plural = _('배송지 목록')
        ordering = ['-is_default', '-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.recipient})"
    
    def save(self, *args, **kwargs):
        # 만약 현재 저장중인 주소가 기본 배송지로 설정되었다면 기존 기본 배송지를 해제
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)