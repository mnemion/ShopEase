from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Order, OrderItem, CartItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'price', 'quantity', 'subtotal')
    fields = ('product', 'product_name', 'price', 'quantity', 'subtotal')
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user_email', 'recipient_name', 'status', 'formatted_total_price', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('order_number', 'user__email', 'recipient_name', 'recipient_phone')
    readonly_fields = ('order_number', 'user', 'total_price', 'created_at', 'updated_at')
    fieldsets = (
        (_('주문 정보'), {
            'fields': ('order_number', 'user', 'status', 'total_price', 'payment_method', 'created_at', 'updated_at')
        }),
        (_('배송 정보'), {
            'fields': ('recipient_name', 'recipient_phone', 'shipping_address1', 'shipping_address2', 'shipping_zip_code', 'shipping_note')
        }),
        (_('결제 정보'), {
            'fields': ('payment_id', 'paid_at')
        }),
    )
    inlines = [OrderItemInline]
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = _('주문자 이메일')
    
    def formatted_total_price(self, obj):
        return format_html('<b>₩{:,}</b>', int(obj.total_price))
    formatted_total_price.short_description = _('총 금액')
    
    def has_delete_permission(self, request, obj=None):
        # 취소된 주문만 삭제 가능
        if obj and obj.status != 'cancelled':
            return False
        return super().has_delete_permission(request, obj)
    
    def get_readonly_fields(self, request, obj=None):
        # 이미 생성된 주문의 경우 더 많은 필드를 읽기 전용으로 설정
        if obj:
            return self.readonly_fields + ('payment_method',)
        return self.readonly_fields

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'quantity', 'subtotal', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'product__name')
    readonly_fields = ('created_at', 'updated_at')
    
    def subtotal(self, obj):
        return format_html('₩{:,}', int(obj.subtotal))
    subtotal.short_description = _('소계')