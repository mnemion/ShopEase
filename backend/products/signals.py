from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.core.cache import cache
from django.utils.text import slugify
import uuid
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import time

from .models import Product, ProductImage, Review, Category

@receiver(pre_save, sender=Product)
def create_product_slug(sender, instance, **kwargs):
    """
    상품이 생성될 때 자동으로 슬러그 생성
    """
    if not instance.slug:
        base_slug = slugify(instance.name)
        # 슬러그가 이미 존재하는 경우 고유 ID 추가
        if Product.objects.filter(slug=base_slug).exists():
            uuid_suffix = str(uuid.uuid4())[:8]  # 8자리 UUID 생성
            instance.slug = f"{base_slug}-{uuid_suffix}"
        else:
            instance.slug = base_slug

@receiver(post_save, sender=Product)
def invalidate_product_cache(sender, instance, **kwargs):
    """
    상품이 저장될 때 관련 캐시 삭제
    """
    # 단일 상품 캐시 삭제
    cache.delete(f'product:{instance.id}')
    cache.delete(f'product_detail:{instance.id}')
    
    # 상품 목록 캐시 삭제 (간단한 방법으로 관련 캐시만 삭제)
    cache.delete('product_list')
    cache.delete(f'category_products:{instance.category_id}')
    
    # 캐시가 너무 많을 수 있으므로 일반적인 패턴의 캐시만 삭제

@receiver(post_save, sender=ProductImage)
def set_main_image(sender, instance, created, **kwargs):
    """
    첫 번째 이미지가 생성될 때 자동으로 대표 이미지로 설정
    """
    if created:
        # 해당 상품의 이미지가 이 이미지 하나뿐인 경우 대표 이미지로 설정
        if ProductImage.objects.filter(product=instance.product).count() == 1:
            instance.is_main = True
            instance.save(update_fields=['is_main'])

@receiver(post_save, sender=Review)
@receiver(post_delete, sender=Review)
def update_product_rating(sender, instance, **kwargs):
    """
    리뷰가 추가, 수정, 삭제될 때 상품 평점 업데이트
    """
    product = instance.product
    reviews = Review.objects.filter(product=product)
    
    if reviews.exists():
        # 평균 평점 계산
        avg_rating = sum(review.rating for review in reviews) / reviews.count()
        # rating_avg 필드가 있다면 업데이트 (모델에 필드 추가 필요)
        # product.rating_avg = avg_rating
        # product.save(update_fields=['rating_avg'])
    
    # 관련 캐시 삭제
    cache.delete(f'product:{product.id}')
    cache.delete(f'product_detail:{product.id}')

@receiver(post_save, sender=Category)
@receiver(post_delete, sender=Category)
def broadcast_category_change(sender, instance, **kwargs):
    """카테고리 변경(저장 또는 삭제) 시 웹소켓 그룹에 메시지 전송"""
    try:
        channel_layer = get_channel_layer()
        
        # 시그널 타입 명확히 판별
        is_delete = kwargs.get('signal') == post_delete
        is_create = not is_delete and kwargs.get('created', False)
        
        action = 'delete' if is_delete else ('create' if is_create else 'update')
        
        # 디버깅을 위해 더 많은 정보 포함
        message = {
            'action': action,
            'id': instance.id,
            'name': instance.name,
            'is_active': instance.is_active,
            'timestamp': int(time.time() * 1000),  # 미리초 타임스탬프
        }

        print(f"==== Category {action} signal for ID: {instance.id}, name: {instance.name} ====")
        print(f"Signal kwargs: {kwargs}")
        print(f"Category instance details: id={instance.id}, name={instance.name}, is_active={instance.is_active}")
        
        # 시그널 핸들러는 동기적으로 실행되므로, 비동기 함수인 group_send를 호출하기 위해 async_to_sync 사용
        async_to_sync(channel_layer.group_send)(
            'category_updates',  # 메시지를 보낼 그룹 이름 (Consumer에서 설정한 이름과 동일)
            {
                "type": "category.update.message",  # Consumer 내부에서 이 메시지를 처리할 메서드 이름 (category_update_message)
                "message": message  # 실제 전달할 데이터
            }
        )
        
        # 카테고리 관련 캐시 무효화 - 더 철저히
        keys_to_delete = [
            'category_list',
            f'category:{instance.id}',
            'homepage_categories',
            'navbar_categories',
            'all_categories'
        ]
        
        for key in keys_to_delete:
            cache.delete(key)
        
        print(f"캐시 항목 삭제: {keys_to_delete}")
        print(f"WebSocket 메시지 전송 완료: {action} for ID: {instance.id}")
        
        # 현재 카테고리 목록을 출력하여 확인
        all_categories = list(Category.objects.values('id', 'name', 'is_active'))
        print(f"현재 카테고리 목록: {all_categories}")
    except Exception as e:
        # 에러가 발생해도 서버가 중단되지 않도록 예외 처리
        print(f"카테고리 변경 알림 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()