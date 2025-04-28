from rest_framework import serializers
from .models import Category, Product, ProductImage, Review

class CategorySerializer(serializers.ModelSerializer):
    """카테고리 시리얼라이저"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'description', 'image', 'image_url', 'parent', 'is_active', 'order')
    
    def get_image_url(self, obj):
        """이미지의 전체 URL을 반환"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class ProductImageSerializer(serializers.ModelSerializer):
    """상품 이미지 시리얼라이저"""
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text', 'is_main', 'order')

class ReviewSerializer(serializers.ModelSerializer):
    """상품 리뷰 시리얼라이저"""
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ('id', 'user', 'user_name', 'title', 'content', 'rating', 'created_at')
        read_only_fields = ('user', 'created_at')
    
    def get_user_name(self, obj):
        """사용자 이름을 반환"""
        return obj.user.name if obj.user.name else obj.user.email.split('@')[0]
    
    def create(self, validated_data):
        # 요청한 사용자를 리뷰 작성자로 설정
        validated_data['user'] = self.context['request'].user
        
        # 중복 리뷰 검사 (이미 해당 상품에 리뷰를 작성했는지)
        user = validated_data['user']
        product = validated_data['product']
        if Review.objects.filter(user=user, product=product).exists():
            raise serializers.ValidationError("이미 이 상품에 리뷰를 작성했습니다.")
        
        return super().create(validated_data)

class ProductSerializer(serializers.ModelSerializer):
    """상품 목록용 간소화된 시리얼라이저"""
    category_name = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()
    is_on_sale = serializers.BooleanField(read_only=True)
    current_price = serializers.DecimalField(read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'slug', 'category', 'category_name', 'price', 
                  'discount_price', 'current_price', 'is_on_sale', 'is_active', 
                  'is_featured', 'main_image', 'created_at')
    
    def get_category_name(self, obj):
        """카테고리 이름을 반환"""
        return obj.category.name if obj.category else None
    
    def get_main_image(self, obj):
        """상품의 대표 이미지 URL을 반환"""
        main_image = obj.images.filter(is_main=True).first()
        if main_image:
            return self.context['request'].build_absolute_uri(main_image.image.url)
        # 대표 이미지가 없으면 첫 번째 이미지 반환
        first_image = obj.images.first()
        if first_image:
            return self.context['request'].build_absolute_uri(first_image.image.url)
        return None

class ProductDetailSerializer(ProductSerializer):
    """상품 상세 시리얼라이저"""
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    rating_avg = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta(ProductSerializer.Meta):
        fields = ProductSerializer.Meta.fields + ('description', 'stock', 'images', 'reviews', 'rating_avg', 'review_count')
    
    def get_rating_avg(self, obj):
        """평균 평점을 계산"""
        if obj.reviews.exists():
            return round(sum(review.rating for review in obj.reviews.all()) / obj.reviews.count(), 1)
        return 0
    
    def get_review_count(self, obj):
        """리뷰 개수를 반환"""
        return obj.reviews.count()

class CategoryTreeSerializer(serializers.ModelSerializer):
    """카테고리 트리 시리얼라이저 - 자식 노드를 재귀적으로 포함"""
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "children")

    def get_children(self, obj):
        """자식 카테고리를 재귀적으로 시리얼라이즈"""
        return CategoryTreeSerializer(
            obj.children.filter(is_active=True).order_by("order"), many=True
        ).data