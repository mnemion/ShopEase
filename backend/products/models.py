from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.conf import settings
from django.core.exceptions import ValidationError
from mptt.models import MPTTModel, TreeForeignKey
from django.db.models import Q, CheckConstraint, Index

class Category(MPTTModel):
    """상품 카테고리 모델"""
    name = models.CharField(_('카테고리명'), max_length=100)
    slug = models.SlugField(_('슬러그'), max_length=100, unique=True)
    description = models.TextField(_('설명'), blank=True)
    image = models.ImageField(_('이미지'), upload_to='categories/', blank=True, null=True)
    parent = TreeForeignKey(
        'self',
        verbose_name=_('상위 카테고리'),
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='children',
        limit_choices_to={'parent__isnull': True},
    )
    is_active = models.BooleanField(_('활성화 여부'), default=True)
    order = models.IntegerField(_('정렬 순서'), default=0)
    created_at = models.DateTimeField(_('생성일'), auto_now_add=True)
    updated_at = models.DateTimeField(_('수정일'), auto_now=True)
    
    class Meta:
        verbose_name = _('카테고리')
        verbose_name_plural = _('카테고리 목록')
        ordering = ['order', 'name']
        constraints = [
            CheckConstraint(
                name="category_max_depth_2",
                check=Q(level__lte=1)
            ),
            models.UniqueConstraint(
                fields=["parent", "name"],
                name="uniq_sibling_name"
            ),
        ]
        indexes = [
            Index(fields=["parent", "order"]),
            Index(fields=["slug"]),
        ]
    
    class MPTTMeta:
        order_insertion_by = ['order', 'name']
    
    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        # 자기 자신을 부모로 지정했는지
        if self.parent_id and self.parent_id == self.id:
            raise ValidationError({'parent': '본인을 상위 카테고리로 설정할 수 없습니다.'})
        # 부모-자식 2단계 초과 차단
        if self.parent and self.parent.parent:
            raise ValidationError({'parent': '카테고리는 최대 2단계(부모-자식)까지만 허용됩니다.'})

class Product(models.Model):
    """상품 모델"""
    name = models.CharField(_('상품명'), max_length=200)
    slug = models.SlugField(_('슬러그'), max_length=200, unique=True)
    description = models.TextField(_('상품 설명'))
    price = models.DecimalField(_('가격'), max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    discount_price = models.DecimalField(_('할인가'), max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    stock = models.PositiveIntegerField(_('재고 수량'), default=0)
    is_active = models.BooleanField(_('판매 여부'), default=True)
    is_featured = models.BooleanField(_('추천 상품'), default=False)
    category = models.ForeignKey(Category, verbose_name=_('카테고리'), on_delete=models.SET_NULL, null=True, related_name='products')
    created_at = models.DateTimeField(_('등록일'), auto_now_add=True)
    updated_at = models.DateTimeField(_('수정일'), auto_now=True)
    
    class Meta:
        verbose_name = _('상품')
        verbose_name_plural = _('상품 목록')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def is_on_sale(self):
        """할인 중인지 확인하는 프로퍼티"""
        return self.discount_price is not None and self.discount_price < self.price
    
    @property
    def current_price(self):
        """현재 판매 가격을 반환하는 프로퍼티 (할인 가격 또는 정상 가격)"""
        if self.is_on_sale:
            return self.discount_price
        return self.price

class ProductImage(models.Model):
    """상품 이미지 모델"""
    product = models.ForeignKey(Product, verbose_name=_('상품'), on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(_('이미지'), upload_to='products/')
    alt_text = models.CharField(_('대체 텍스트'), max_length=200, blank=True)
    is_main = models.BooleanField(_('대표 이미지'), default=False)
    order = models.IntegerField(_('정렬 순서'), default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _('상품 이미지')
        verbose_name_plural = _('상품 이미지 목록')
        ordering = ['order']
    
    def __str__(self):
        return f"{self.product.name} - 이미지 {self.id}"
    
    def save(self, *args, **kwargs):
        # 대표 이미지로 설정되었다면 기존 대표 이미지 해제
        if self.is_main:
            ProductImage.objects.filter(product=self.product, is_main=True).update(is_main=False)
        super().save(*args, **kwargs)

class Review(models.Model):
    """상품 리뷰 모델"""
    RATING_CHOICES = [
        (1, '★'),
        (2, '★★'),
        (3, '★★★'),
        (4, '★★★★'),
        (5, '★★★★★'),
    ]
    
    product = models.ForeignKey(Product, verbose_name=_('상품'), on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, verbose_name=_('작성자'), on_delete=models.CASCADE)
    title = models.CharField(_('제목'), max_length=200)
    content = models.TextField(_('내용'))
    rating = models.IntegerField(_('평점'), choices=RATING_CHOICES)
    created_at = models.DateTimeField(_('작성일'), auto_now_add=True)
    updated_at = models.DateTimeField(_('수정일'), auto_now=True)
    
    class Meta:
        verbose_name = _('상품 리뷰')
        verbose_name_plural = _('상품 리뷰 목록')
        ordering = ['-created_at']
        # 한 사용자가 동일 상품에 여러 리뷰를 남기지 못하게 제약 설정
        constraints = [
            models.UniqueConstraint(fields=['product', 'user'], name='unique_review_per_product_user')
        ]
    
    def __str__(self):
        return f"{self.product.name} - {self.user.email} - {self.rating}점"