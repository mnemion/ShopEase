from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, CharFilter, DateTimeFilter
from django.db.models import Sum, F
from .models import CartItem, Order
from .serializers import CartItemSerializer, OrderSerializer, CheckoutSerializer
from .tasks import send_order_confirmation_email, send_payment_complete_email
from products.tasks import update_product_stock, send_low_stock_notification

class OrderFilter(FilterSet):
    """주문 필터링 클래스"""
    order_number = CharFilter(lookup_expr='icontains')
    status = CharFilter(lookup_expr='exact')
    created_after = DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Order
        fields = ['status']

class CartItemViewSet(viewsets.ModelViewSet):
    """장바구니 상품 CRUD API"""
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """현재 사용자의 장바구니 상품만 조회"""
        return CartItem.objects.filter(user=self.request.user).select_related('product').order_by('id')
    
    def perform_create(self, serializer):
        """장바구니 상품 생성 시 실행"""
        cart_item = serializer.save()
        product = cart_item.product
        
        # 재고가 임계값 이하로 내려가면 알림 태스크 실행
        if product.stock <= 5:
            send_low_stock_notification.delay(
                product_id=product.id,
                current_stock=product.stock
            )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """장바구니 요약 정보 조회 API"""
        cart_items = self.get_queryset()
        total_items = cart_items.count()
        total_price = sum(item.subtotal for item in cart_items)
        
        return Response({
            'total_items': total_items,
            'total_price': total_price,
        })
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """장바구니 비우기 API"""
        self.get_queryset().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class OrderViewSet(viewsets.ModelViewSet):
    """주문 관리 API"""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = OrderFilter
    
    def get_queryset(self):
        """현재 사용자의 주문만 조회"""
        return Order.objects.filter(user=self.request.user).prefetch_related('items')
    
    @action(detail=False, methods=['post'])
    def checkout(self, request):
        """장바구니에서 주문하기 API"""
        serializer = CheckoutSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            order = serializer.save()
            
            # 주문 확인 이메일 발송 태스크 실행
            send_order_confirmation_email.delay(
                order_id=order.id,
                email=request.user.email,
                order_number=order.order_number,
                total_price=float(order.total_price)
            )
            
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """주문 취소 API"""
        order = self.get_object()
        
        # 결제 대기 상태일 때만 취소 가능
        if order.status != 'pending':
            return Response(
                {"detail": "결제 완료된 주문은 취소할 수 없습니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 주문 상태 취소로 변경
        order.status = 'cancelled'
        order.save()
        
        # 상품 재고 복구 (비동기 태스크로 처리)
        for item in order.items.all():
            update_product_stock.delay(
                product_id=item.product.id,
                quantity=item.quantity
            )
        
        return Response(OrderSerializer(order).data)
    
    @action(detail=True, methods=['post'])
    def payment_complete(self, request, pk=None):
        """결제 완료 처리 API (시뮬레이션)"""
        order = self.get_object()
        
        # 이미 처리된 주문인지 확인
        if order.status != 'pending':
            return Response(
                {"detail": "이미 처리된 주문입니다."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 결제 정보 업데이트
        order.status = 'paid'
        order.payment_id = request.data.get('payment_id', '')
        from django.utils import timezone
        order.paid_at = timezone.now()
        order.save()
        
        # 결제 완료 이메일 발송 태스크 실행
        send_payment_complete_email.delay(
            order_id=order.id,
            email=order.user.email,
            order_number=order.order_number,
            total_price=float(order.total_price),
            payment_method=order.payment_method
        )
        
        return Response(OrderSerializer(order).data)