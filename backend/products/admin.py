from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from .models import Category, Product, ProductImage, Review
from django import forms
from django.core.exceptions import ValidationError
from mptt.admin import MPTTModelAdmin

class ProductImageInline(admin.TabularInline):
    """상품 이미지 인라인 어드민"""
    model = ProductImage
    extra = 1
    readonly_fields = ('image_preview',)
    
    def image_preview(self, obj):
        """이미지 미리보기 표시"""
        if obj.image:
            return format_html('<img src="{}" width="100" height="100" style="object-fit: cover;" />', obj.image.url)
        return '(이미지 없음)'
    
    image_preview.short_description = '미리보기'

class ReviewInline(admin.TabularInline):
    """상품 리뷰 인라인 어드민"""
    model = Review
    extra = 0
    readonly_fields = ('user', 'created_at')
    fields = ('user', 'rating', 'title', 'content', 'created_at')
    can_delete = False
    max_num = 10

class CategoryAdminForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # ① parent 필드에 루트만 노출
        root_qs = Category.objects.filter(parent__isnull=True)
        self.fields["parent"].queryset = root_qs

        # ② 이미 저장된 카테고리를 수정할 땐
        #    현재 선택돼 있던 값(루트가 아닐 수도 있음)을 같이 보여줘야 오류가 안 난다
        if self.instance.pk and self.instance.parent:
            self.fields["parent"].queryset |= Category.objects.filter(pk=self.instance.parent.pk)

    def clean_parent(self):
        parent = self.cleaned_data.get("parent")

        # ③ 루트가 아닌 노드를 상위로 고르려 하면 차단
        if parent and parent.parent:
            raise ValidationError("상위 카테고리는 최상위 카테고리만 선택할 수 있습니다.")
        return parent

@admin.register(Category)
class CategoryAdmin(MPTTModelAdmin):
    form                = CategoryAdminForm
    autocomplete_fields = ["parent"]
    list_display        = ("name", "slug", "parent", "is_active", "order")
    list_select_related = ("parent",)
    search_fields       = ("name", "slug")
    list_filter         = ("is_active",)
    mptt_level_indent   = 20
    show_tree           = False

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """상품 관리 어드민"""
    list_display = ('name', 'category', 'price', 'discount_price', 'stock', 'is_active', 'is_featured', 'created_at')
    list_filter = ('is_active', 'is_featured', 'category', 'created_at')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ('price', 'discount_price', 'stock', 'is_active', 'is_featured')
    inlines = [ProductImageInline, ReviewInline]
    
    fieldsets = (
        (_('기본 정보'), {
            'fields': ('name', 'slug', 'description', 'category')
        }),
        (_('가격 및 재고'), {
            'fields': ('price', 'discount_price', 'stock')
        }),
        (_('표시 설정'), {
            'fields': ('is_active', 'is_featured') 
        }),
    )
    
    def get_readonly_fields(self, request, obj=None):
        """슈퍼유저가 아닌 경우 slug 필드를 읽기 전용으로 설정"""
        if not request.user.is_superuser:
            return ('slug',)
        return super().get_readonly_fields(request, obj)

@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """상품 이미지 관리 어드민"""
    list_display = ('id', 'product', 'alt_text', 'is_main', 'image_preview', 'order')
    list_filter = ('is_main', 'product')
    search_fields = ('product__name', 'alt_text')
    list_editable = ('is_main', 'alt_text', 'order')
    
    def image_preview(self, obj):
        """이미지 미리보기 표시"""
        if obj.image:
            return format_html('<img src="{}" width="100" height="100" style="object-fit: cover;" />', obj.image.url)
        return '(이미지 없음)'
    
    image_preview.short_description = '미리보기'

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    """상품 리뷰 관리 어드민"""
    list_display = ('id', 'product', 'user', 'rating', 'title', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__email', 'title', 'content')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('product', 'user')
    
    fieldsets = (
        (_('리뷰 정보'), {
            'fields': ('product', 'user', 'rating', 'title', 'content')
        }),
        (_('날짜 정보'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )