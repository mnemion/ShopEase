from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.validators import MinValueValidator
from products.models import Product

class CartItem(models.Model):
    """장바구니 상품 모델"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_('사용자'), on_delete=models.CASCADE, related_name='cart_items')
    product = models.ForeignKey(Product, verbose_name=_('상품'), on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(_('수량'), default=1)
    created_at = models.DateTimeField(_('추가일'), auto_now_add=True)
    updated_at = models.DateTimeField(_('수정일'), auto_now=True)
    
    class Meta:
        verbose_name = _('장바구니 상품')
        verbose_name_plural = _('장바구니 상품 목록')
        unique_together = ('user', 'product')  # 동일 사용자/상품 중복 방지
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name} ({self.quantity}개)"
    
    @property
    def subtotal(self):
        """상품 소계 계산 (현재 가격 * 수량)"""
        return self.product.current_price * self.quantity

class Order(models.Model):
    """주문 모델"""
    STATUS_CHOICES = [
        ('pending', _('결제 대기')),
        ('paid', _('결제 완료')),
        ('shipping', _('배송 중')),
        ('delivered', _('배송 완료')),
        ('cancelled', _('주문 취소')),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('card', _('신용카드')),
        ('bank_transfer', _('계좌이체')),
        ('mobile', _('휴대폰 결제')),
        ('virtual_account', _('가상계좌')),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_('주문자'), on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(_('주문번호'), max_length=20, unique=True)
    status = models.CharField(_('주문상태'), max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(_('총 금액'), max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    payment_method = models.CharField(_('결제 방법'), max_length=20, choices=PAYMENT_METHOD_CHOICES)
    
    # 배송 정보
    recipient_name = models.CharField(_('수령인'), max_length=100)
    recipient_phone = models.CharField(_('연락처'), max_length=15)
    shipping_address1 = models.CharField(_('기본주소'), max_length=200)
    shipping_address2 = models.CharField(_('상세주소'), max_length=200, blank=True)
    shipping_zip_code = models.CharField(_('우편번호'), max_length=10)
    shipping_note = models.CharField(_('배송메모'), max_length=200, blank=True)
    
    # 결제 정보
    payment_id = models.CharField(_('결제 ID'), max_length=100, blank=True)
    paid_at = models.DateTimeField(_('결제일'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('주문일'), auto_now_add=True)
    updated_at = models.DateTimeField(_('수정일'), auto_now=True)
    
    class Meta:
        verbose_name = _('주문')
        verbose_name_plural = _('주문 목록')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"주문 #{self.order_number} ({self.user.email})"
    
    def save(self, *args, **kwargs):
        # 주문번호 생성 로직 (신규 생성 시)
        if not self.order_number:
            import uuid
            import time
            # 현재 timestamp + uuid 일부를 사용한 주문번호 생성
            timestamp = int(time.time())
            unique_id = str(uuid.uuid4()).split('-')[0]
            self.order_number = f"{timestamp}{unique_id}"[:20]
        super().save(*args, **kwargs)

class OrderItem(models.Model):
    """주문 상품 모델"""
    order = models.ForeignKey(Order, verbose_name=_('주문'), on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, verbose_name=_('상품'), on_delete=models.CASCADE)
    product_name = models.CharField(_('상품명'), max_length=200)  # 주문 시점의 상품 정보 스냅샷
    price = models.DecimalField(_('가격'), max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    quantity = models.PositiveIntegerField(_('수량'), default=1)
    
    class Meta:
        verbose_name = _('주문 상품')
        verbose_name_plural = _('주문 상품 목록')
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product_name} ({self.quantity}개)"
    
    @property
    def subtotal(self):
        """상품 소계 계산 (가격 * 수량)"""
        return self.price * self.quantity