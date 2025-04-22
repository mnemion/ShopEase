from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Address

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """사용자 관리 어드민"""
    list_display = ('email', 'name', 'phone', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'name', 'phone')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('개인정보'), {'fields': ('name', 'phone')}),
        (_('권한'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('중요 날짜'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'name', 'phone', 'is_active', 'is_staff'),
        }),
    )

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    """배송지 관리 어드민"""
    list_display = ('user', 'name', 'recipient', 'phone', 'is_default', 'created_at')
    list_filter = ('is_default', 'created_at')
    search_fields = ('user__email', 'name', 'recipient', 'phone', 'zip_code', 'address1')
    raw_id_fields = ('user',)
    
    fieldsets = (
        (_('소유자 정보'), {'fields': ('user',)}),
        (_('배송지 정보'), {'fields': ('name', 'recipient', 'phone', 'zip_code', 'address1', 'address2', 'is_default')}),
        (_('날짜 정보'), {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
    
    readonly_fields = ('created_at', 'updated_at')