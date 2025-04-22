from django.db.models.signals import post_save, pre_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from django.conf import settings
import string
import random

from .models import Order, OrderItem, CartItem

@receiver(pre_save, sender=Order)
def generate_order_number(sender, instance, **kwargs):
    """
    주문 번호 생성 함수
    """
    if not instance.order_number:
        # 주문번호 생성 로직: 현재시간 + 랜덤 문자열
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        instance.order_number = f"{timestamp}{random_chars}"[:20]

@receiver(post_save, sender=Order)
def handle_order_status_change(sender, instance, created, **kwargs):
    """
    주문 상태 변경 시 처리 함수
    """
    # 새로 생성된 주문이면 주문 생성 이메일 발송
    if created:
        # 주문 생성 이메일 발송
        from .tasks import send_order_confirmation_email
        send_order_confirmation_email.delay(
            order_id=instance.id,
            email=instance.user.email,
            order_number=instance.order_number
        )
    
    # 새로 생성된 주문이 아니라면 상태 변경을 확인
    elif not created and 'update_fields' in kwargs and 'status' in kwargs['update_fields']:
        # 상태에 따른 처리
        if instance.status == 'paid':
            # 결제 완료 처리
            instance.paid_at = timezone.now()
            instance.save(update_fields=['paid_at'])
            
            # 이메일 발송은 tasks.py에서 처리 (Celery)
            from .tasks import send_payment_complete_email
            send_payment_complete_email.delay(
                order_id=instance.id,
                email=instance.user.email,
                order_number=instance.order_number,
                total_price=float(instance.total_price),
                payment_method=instance.payment_method
            )
        
        elif instance.status == 'shipping':
            # 배송 시작 처리
            from .tasks import send_shipping_update_email
            send_shipping_update_email.delay(
                order_id=instance.id,
                email=instance.user.email,
                order_number=instance.order_number
            )
            
        elif instance.status == 'delivered':
            # 배송 완료 처리
            from .tasks import send_delivery_complete_email
            send_delivery_complete_email.delay(
                order_id=instance.id,
                email=instance.user.email,
                order_number=instance.order_number
            )
        
        elif instance.status == 'cancelled':
            # 주문 취소 시 상품 재고 복구 (tasks.py에서 비동기 처리)
            from products.tasks import update_product_stock
            for item in instance.items.all():
                update_product_stock.delay(
                    product_id=item.product.id,
                    quantity=item.quantity
                )

@receiver(post_save, sender=CartItem)
def check_stock_on_cart_update(sender, instance, created, **kwargs):
    """
    장바구니 상품이 추가/수정될 때 재고 확인
    """
    product = instance.product
    
    # 재고가 임계값 이하면 알림 발송
    if product.stock <= settings.LOW_STOCK_THRESHOLD:
        from products.tasks import send_low_stock_notification
        send_low_stock_notification.delay(
            product_id=product.id,
            current_stock=product.stock
        )

@receiver(pre_delete, sender=OrderItem)
def restore_stock_on_order_item_delete(sender, instance, **kwargs):
    """
    주문 상품이 삭제될 때 재고 복구
    """
    # 주문 상태가 취소가 아닌 경우만 재고 복구
    if instance.order.status not in ['cancelled', 'pending']:
        product = instance.product
        product.stock += instance.quantity
        product.save(update_fields=['stock'])

# 재고가 충분한지 확인하는 시그널 추가
@receiver(pre_save, sender=CartItem)
def validate_cart_item_quantity(sender, instance, **kwargs):
    """
    장바구니 상품이 추가/수정될 때 재고가 충분한지 확인
    """
    if instance.quantity > instance.product.stock:
        from django.core.exceptions import ValidationError
        raise ValidationError(f"상품 '{instance.product.name}'의 재고가 부족합니다. 현재 재고: {instance.product.stock}")