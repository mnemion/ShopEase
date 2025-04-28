from rest_framework import viewsets, filters, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter, CharFilter, BooleanFilter
from django.db.models import F
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie
from .models import Category, Product, Review
from .serializers import (
    CategorySerializer, 
    ProductSerializer, 
    ProductDetailSerializer,
    ReviewSerializer,
    CategoryTreeSerializer
)

class ProductFilter(FilterSet):
    """상품 필터링 클래스"""
    min_price = NumberFilter(field_name="price", lookup_expr='gte')
    max_price = NumberFilter(field_name="price", lookup_expr='lte')
    category_name = CharFilter(field_name="category__name", lookup_expr='icontains')
    is_featured = BooleanFilter(field_name="is_featured")
    is_on_sale = BooleanFilter(method='filter_is_on_sale')
    parent = NumberFilter(method='filter_parent')
    
    class Meta:
        model = Product
        fields = ['category', 'is_featured', 'is_active']
    
    def filter_is_on_sale(self, queryset, name, value):
        """할인 중인 상품 필터링"""
        if value:
            return queryset.filter(discount_price__isnull=False).filter(discount_price__lt=F('price'))
        return queryset
    
    def filter_parent(self, queryset, name, value):
        """부모 카테고리 ID로 필터링 (자손 포함)"""
        try:
            parent = Category.objects.get(pk=value)
            descendants = parent.get_descendants(include_self=True)
            return queryset.filter(category__in=descendants)
        except Category.DoesNotExist:
            return queryset.none()

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """카테고리 조회 API"""
    queryset = Category.objects.filter(is_active=True)\
        .select_related("parent")\
        .only("id", "name", "slug", "parent_id", "order", "image")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        qs = super().get_queryset()
        parent = self.request.query_params.get('parent')
        if parent is None:
            # 루트만
            return qs.filter(parent__isnull=True).order_by('order')
        return qs.filter(parent_id=parent).order_by('order')

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        /api/categories/{pk}/children/
        해당 카테고리의 바로 밑 자식들만
        """
        node = self.get_object()
        qs = node.children.filter(is_active=True).order_by('order')
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path="tree")
    @method_decorator(cache_page(60 * 60))  # 1시간 캐싱
    def tree(self, request):
        """
        /api/categories/tree/
        전체 카테고리 트리 구조 반환
        """
        qs = Category.objects.filter(parent__isnull=True, is_active=True).order_by("order")
        serializer = CategoryTreeSerializer(qs, many=True)
        return Response(serializer.data)

    # 카테고리 리스트 캐싱 (1시간)
    @method_decorator(cache_page(60 * 60))
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def get_serializer_context(self):
        """
        시리얼라이저 컨텍스트에 request 객체를 추가하여
        이미지 URL을 절대 경로로 생성할 수 있도록 함
        """
        context = super().get_serializer_context()
        return context

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """상품 조회 API"""
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']
    
    # 상품 목록 캐싱 (쿠키 별로 다르게 캐싱, 10분)
    @method_decorator(cache_page(60 * 10))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    # 상품 상세 캐싱 (10분)
    @method_decorator(cache_page(60 * 10))
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    def get_serializer_class(self):
        # 상세 조회 시 DetailSerializer 사용
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductSerializer
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def review(self, request, pk=None):
        """상품 리뷰 작성 API"""
        product = self.get_object()
        serializer = ReviewSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.save(product=product, user=request.user)
            # 리뷰 작성 후 캐시 무효화 태스크 예약
            from .tasks import invalidate_product_cache
            invalidate_product_cache.delay(product.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """추천 상품 API"""
        featured_products = self.get_queryset().filter(is_featured=True)[:8]
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        """할인 상품 API"""
        on_sale_products = self.get_queryset().filter(
            discount_price__isnull=False
        ).filter(
            discount_price__lt=F('price')
        )[:8]
        serializer = self.get_serializer(on_sale_products, many=True)
        return Response(serializer.data)

class ReviewViewSet(viewsets.ModelViewSet):
    """리뷰 관리 API"""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """로그인한 사용자의 리뷰만 조회 가능"""
        return Review.objects.filter(user=self.request.user)
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # 자신의 리뷰만 수정 가능
        if instance.user != request.user:
            return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
        
        result = super().update(request, *args, **kwargs)
        
        # 리뷰 수정 후 캐시 무효화 태스크 예약
        from .tasks import invalidate_product_cache
        invalidate_product_cache.delay(instance.product.id)
        
        return result
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # 자신의 리뷰만 삭제 가능
        if instance.user != request.user:
            return Response({"detail": "권한이 없습니다."}, status=status.HTTP_403_FORBIDDEN)
        
        product_id = instance.product.id
        result = super().destroy(request, *args, **kwargs)
        
        # 리뷰 삭제 후 캐시 무효화 태스크 예약
        from .tasks import invalidate_product_cache
        invalidate_product_cache.delay(product_id)
        
        return result