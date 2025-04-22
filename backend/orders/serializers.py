from rest_framework import serializers
from django.db import transaction
from .models import CartItem, Order, OrderItem
from products.models import Product
from products.serializers import ProductSerializer

class CartItemSerializer(serializers.ModelSerializer):
    """장바구니 상품 시리얼라이저"""
    product_detail = ProductSerializer(source='product', read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_detail', 'quantity', 'subtotal', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def validate(self, attrs):
        # 상품 재고 확인
        if 'product' in attrs and 'quantity' in attrs:
            product = attrs['product']
            quantity = attrs['quantity']
            if product.stock < quantity:
                raise serializers.ValidationError({"quantity": f"재고가 부족합니다. 현재 재고: {product.stock}"})
        return attrs
    
    def create(self, validated_data):
        user = self.context['request'].user
        product = validated_data['product']
        quantity = validated_data['quantity']
        
        # 이미 장바구니에 있는 상품이면 수량 업데이트
        try:
            cart_item = CartItem.objects.get(user=user, product=product)
            cart_item.quantity += quantity
            cart_item.save()
            return cart_item
        except CartItem.DoesNotExist:
            # 없으면 새로 생성
            return CartItem.objects.create(user=user, **validated_data)

class OrderItemSerializer(serializers.ModelSerializer):
    """주문 상품 시리얼라이저"""
    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'price', 'quantity', 'subtotal')
        read_only_fields = ('id', 'product_name', 'price', 'subtotal')

class OrderSerializer(serializers.ModelSerializer):
    """주문 시리얼라이저"""
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ('id', 'order_number', 'status', 'total_price', 'payment_method',
                  'recipient_name', 'recipient_phone', 'shipping_address1',
                  'shipping_address2', 'shipping_zip_code', 'shipping_note',
                  'payment_id', 'paid_at', 'created_at', 'items')
        read_only_fields = ('id', 'order_number', 'created_at', 'total_price', 'payment_id', 'paid_at')

class CheckoutSerializer(serializers.Serializer):
    """결제 시리얼라이저"""
    cart_items = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="장바구니 상품 ID 목록"
    )
    payment_method = serializers.ChoiceField(
        choices=Order.PAYMENT_METHOD_CHOICES,
        required=True,
        help_text="결제 방법"
    )
    recipient_name = serializers.CharField(max_length=100, required=True)
    recipient_phone = serializers.CharField(max_length=15, required=True)
    shipping_address1 = serializers.CharField(max_length=200, required=True)
    shipping_address2 = serializers.CharField(max_length=200, required=False, allow_blank=True)
    shipping_zip_code = serializers.CharField(max_length=10, required=True)
    shipping_note = serializers.CharField(max_length=200, required=False, allow_blank=True)
    
    def validate_cart_items(self, value):
        """장바구니 상품 ID 유효성 검사"""
        # 사용자가 제공한 장바구니 ID가 실제 해당 사용자의 장바구니 상품인지 확인
        user = self.context['request'].user
        cart_items = CartItem.objects.filter(id__in=value, user=user)
        
        if len(cart_items) != len(value):
            raise serializers.ValidationError("일부 장바구니 상품이 존재하지 않습니다.")
        
        # 모든 상품의 재고 확인
        for item in cart_items:
            if item.product.stock < item.quantity:
                raise serializers.ValidationError(f"상품 '{item.product.name}'의 재고가 부족합니다.")
        
        return value
    
    @transaction.atomic
    def create(self, validated_data):
        user = self.context['request'].user
        cart_item_ids = validated_data.pop('cart_items')
        cart_items = CartItem.objects.filter(id__in=cart_item_ids, user=user)
        
        # 총 주문 금액 계산
        total_price = sum(item.subtotal for item in cart_items)
        
        # 주문 생성
        order = Order.objects.create(
            user=user,
            total_price=total_price,
            **validated_data
        )
        
        # 주문 상품 생성 및 재고 감소
        for cart_item in cart_items:
            product = cart_item.product
            
            # 주문 상품 생성
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                price=product.current_price,
                quantity=cart_item.quantity
            )
            
            # 재고 감소
            product.stock -= cart_item.quantity
            product.save()
            
            # 장바구니에서 삭제
            cart_item.delete()
        
        return order