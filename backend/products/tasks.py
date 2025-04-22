from celery import shared_task
from django.core.cache import cache
from django.urls import reverse

@shared_task
def invalidate_product_cache(product_id):
    """상품 캐시 무효화 태스크
    
    상품 수정, 리뷰 작성/수정/삭제 시 호출되어 캐시를 갱신합니다.
    """
    # 상품 상세 페이지 캐시 삭제
    product_detail_path = reverse('products:product-detail', kwargs={'pk': product_id})
    cache.delete(f'views.decorators.cache.cache_page.{product_detail_path}')
    
    # 상품 목록 관련 캐시는 너무 많을 수 있으므로 전체 캐시를 비우는 대신
    # 특정 패턴의 캐시만 삭제하는 것이 좋습니다.
    # 하지만 Django의 cache 모듈은 패턴 매칭을 직접 지원하지 않습니다.
    # 이를 위해 redis-cli 명령어를 사용하는 방법도 있지만,
    # 여기서는 간단하게 상품 목록 캐시 키만 삭제합니다.
    product_list_path = reverse('products:product-list')
    cache.delete(f'views.decorators.cache.cache_page.{product_list_path}')

@shared_task
def update_product_stock(product_id, quantity):
    """상품 재고 업데이트 태스크
    
    주문 취소나 환불 시 호출되어 상품 재고를 다시 증가시킵니다.
    """
    from products.models import Product
    
    try:
        product = Product.objects.get(id=product_id)
        product.stock += quantity
        product.save(update_fields=['stock'])
        
        # 캐시 무효화
        invalidate_product_cache(product_id)
        
        return {
            'success': True,
            'product_id': product_id,
            'new_stock': product.stock
        }
    except Product.DoesNotExist:
        return {
            'success': False,
            'error': f'Product with ID {product_id} does not exist.'
        }

@shared_task
def send_low_stock_notification(product_id, current_stock, threshold=5):
    """재고 부족 알림 태스크
    
    상품 재고가 임계값 이하로 떨어지면 관리자에게 알림을 보냅니다.
    """
    from django.core.mail import send_mail
    from django.conf import settings
    from products.models import Product
    
    try:
        product = Product.objects.get(id=product_id)
        
        # 관리자 이메일로 낮은 재고 알림 발송
        send_mail(
            subject=f'[ShopEase] 상품 재고 부족 알림 - {product.name}',
            message=f"""
            안녕하세요, ShopEase 관리자님.
            
            다음 상품의 재고가 임계값({threshold}개) 이하로 떨어졌습니다:
            
            상품명: {product.name}
            현재 재고: {current_stock}개
            
            재고를 보충해주세요.
            
            감사합니다.
            ShopEase 시스템
            """,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['admin@shopease.com'],  # 실제 관리자 이메일로 변경해야 함
            fail_silently=False,
        )
        
        return {
            'success': True,
            'product_id': product_id,
            'product_name': product.name,
            'current_stock': current_stock
        }
    except Product.DoesNotExist:
        return {
            'success': False,
            'error': f'Product with ID {product_id} does not exist.'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }