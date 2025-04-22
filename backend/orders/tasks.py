from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail

@shared_task
def send_order_confirmation_email(order_id, email, order_number, total_price):
    """주문 확인 이메일 발송 태스크"""
    subject = f'[ShopEase] 주문이 완료되었습니다. (주문번호: {order_number})'
    message = f"""
    안녕하세요, ShopEase 고객님.
    
    주문이 성공적으로 완료되었습니다.
    
    주문 번호: {order_number}
    결제 금액: {total_price}원
    주문 일시: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
    
    주문 상세 내역은 마이페이지에서 확인하실 수 있습니다.
    
    감사합니다.
    ShopEase 드림
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    
    return {
        'success': True,
        'order_id': order_id,
        'email': email
    }

@shared_task
def send_payment_complete_email(order_id, email, order_number, total_price, payment_method):
    """결제 완료 이메일 발송 태스크"""
    payment_methods = {
        'card': '신용카드',
        'bank_transfer': '계좌이체',
        'mobile': '휴대폰 결제',
        'virtual_account': '가상계좌'
    }
    
    payment_method_display = payment_methods.get(payment_method, payment_method)
    
    subject = f'[ShopEase] 결제가 완료되었습니다. (주문번호: {order_number})'
    message = f"""
    안녕하세요, ShopEase 고객님.
    
    결제가 성공적으로 완료되었습니다.
    
    주문 번호: {order_number}
    결제 금액: {total_price}원
    결제 방법: {payment_method_display}
    결제 일시: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
    
    주문 상세 내역은 마이페이지에서 확인하실 수 있습니다.
    
    감사합니다.
    ShopEase 드림
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    
    return {
        'success': True,
        'order_id': order_id,
        'email': email
    }

@shared_task
def send_shipping_update_email(order_id, email, order_number, tracking_number=None, carrier=None):
    """배송 상태 업데이트 이메일 발송 태스크"""
    subject = f'[ShopEase] 주문하신 상품이 발송되었습니다. (주문번호: {order_number})'
    
    message = f"""
    안녕하세요, ShopEase 고객님.
    
    주문하신 상품이 발송되었습니다.
    
    주문 번호: {order_number}
    발송 일시: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
    """
    
    if tracking_number and carrier:
        message += f"""
    택배사: {carrier}
    운송장 번호: {tracking_number}
    
    배송 조회는 택배사 웹사이트에서 가능합니다.
    """
    
    message += """
    감사합니다.
    ShopEase 드림
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    
    return {
        'success': True,
        'order_id': order_id,
        'email': email
    }

@shared_task
def process_abandoned_carts(hours=24):
    """일정 시간 이상 방치된 장바구니 처리 태스크"""
    from django.utils import timezone
    from datetime import timedelta
    from orders.models import CartItem
    from django.db.models import F
    
    # 지정된 시간(기본 24시간) 이상 된 장바구니 아이템 조회
    cutoff_time = timezone.now() - timedelta(hours=hours)
    abandoned_carts = CartItem.objects.filter(updated_at__lt=cutoff_time)
    
    # 방치된 장바구니 수
    cart_count = abandoned_carts.count()
    
    if cart_count > 0:
        # 이메일 알림 또는 로깅 가능
        # 여기서는 간단히 로그만 남김
        print(f"{cart_count}개의 방치된 장바구니가 발견되었습니다.")
        
        # 필요에 따라 장바구니 아이템 삭제 또는 다른 처리 가능
        # abandoned_carts.delete()
    
    return {
        'success': True,
        'abandoned_cart_count': cart_count,
        'cutoff_time': cutoff_time
    }

@shared_task
def clean_old_orders(days=90):
    """오래된 주문 데이터 정리 태스크 (예: 90일 이상 된 주문)"""
    from django.utils import timezone
    from datetime import timedelta
    from orders.models import Order
    
    # 지정된 일수(기본 90일) 이상 된 주문 조회
    cutoff_date = timezone.now() - timedelta(days=days)
    
    # 여기서는 삭제하지 않고 상태만 확인
    old_orders_count = Order.objects.filter(created_at__lt=cutoff_date).count()
    
    return {
        'success': True,
        'old_orders_count': old_orders_count,
        'cutoff_date': cutoff_date
    }

@shared_task
def send_delivery_complete_email(order_id, email, order_number):
    """배송 완료 이메일 발송 태스크"""
    from orders.models import Order
    
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return {
            'success': False,
            'error': f'주문을 찾을 수 없습니다. ID: {order_id}'
        }
    
    subject = f'[ShopEase] 주문하신 상품이 배송 완료되었습니다. (주문번호: {order_number})'
    message = f"""
    안녕하세요, ShopEase 고객님.
    
    주문하신 상품의 배송이 완료되었습니다.
    
    주문 번호: {order_number}
    배송 완료 일시: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
    
    상품에 대한 리뷰를 작성하시면 적립금 혜택을 드립니다.
    상품 수령 후 7일 이내에 교환/반품 신청이 가능합니다.
    
    이용해 주셔서 감사합니다.
    ShopEase 드림
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )
    
    return {
        'success': True,
        'order_id': order_id,
        'email': email
    }