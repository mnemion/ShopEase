import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Category, Product
from orders.models import CartItem, Order

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def user(django_user_model):
    return django_user_model.objects.create_user(
        email='test@example.com',
        password='password123',
        name='Test User'
    )

@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def category():
    return Category.objects.create(
        name="테스트 카테고리",
        slug="test-category",
        description="테스트용 카테고리입니다."
    )

@pytest.fixture
def product(category):
    return Product.objects.create(
        name="테스트 상품",
        slug="test-product",
        description="테스트용 상품입니다.",
        price=10000,
        stock=100,
        category=category
    )

@pytest.fixture
def cart_item(user, product):
    return CartItem.objects.create(
        user=user,
        product=product,
        quantity=2
    )

@pytest.mark.django_db
class TestCartAPI:
    def test_cart_list_unauthorized(self, api_client):
        url = reverse('orders:cart-list')
        response = api_client.get(url)
        
        # 인증되지 않은 사용자는 장바구니에 접근할 수 없음
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_cart_list_authorized(self, authenticated_client, cart_item):
        url = reverse('orders:cart-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['product'] == cart_item.product.id
        assert response.data['results'][0]['quantity'] == cart_item.quantity
    
    def test_add_to_cart(self, authenticated_client, product):
        url = reverse('orders:cart-list')
        data = {
            'product': product.id,
            'quantity': 3
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['product'] == product.id
        assert response.data['quantity'] == 3
        
        # 장바구니에 상품이 실제로 추가되었는지 확인
        cart_items = CartItem.objects.filter(user__email='test@example.com', product=product)
        assert cart_items.exists()
        assert cart_items.first().quantity == 3
    
    def test_update_cart_item(self, authenticated_client, cart_item):
        url = reverse('orders:cart-detail', kwargs={'pk': cart_item.pk})
        data = {
            'quantity': 5
        }
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['quantity'] == 5
        
        # 장바구니 상품 수량이 실제로 업데이트되었는지 확인
        cart_item.refresh_from_db()
        assert cart_item.quantity == 5
    
    def test_remove_from_cart(self, authenticated_client, cart_item):
        url = reverse('orders:cart-detail', kwargs={'pk': cart_item.pk})
        response = authenticated_client.delete(url)
        
        assert response.status_code == status.HTTP_204_NO_CONTENT
        
        # 장바구니에서 상품이 실제로 삭제되었는지 확인
        assert not CartItem.objects.filter(id=cart_item.id).exists()
    
    def test_cart_summary(self, authenticated_client, cart_item):
        url = reverse('orders:cart-summary')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_items'] == 1
        assert response.data['total_price'] == float(cart_item.product.price * cart_item.quantity)

@pytest.mark.django_db
class TestOrderAPI:
    @pytest.fixture
    def checkout_data(self, cart_item):
        return {
            'cart_items': [cart_item.id],
            'payment_method': 'card',
            'recipient_name': 'Test Recipient',
            'recipient_phone': '01012345678',
            'shipping_zip_code': '12345',
            'shipping_address1': '서울시 강남구 테헤란로',
            'shipping_address2': '123번지',
            'shipping_note': '문 앞에 놓아주세요'
        }
    
    def test_checkout_unauthorized(self, api_client, checkout_data):
        url = reverse('orders:orders-checkout')
        response = api_client.post(url, checkout_data, format='json')
        
        # 인증되지 않은 사용자는 주문할 수 없음
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_checkout_authorized(self, authenticated_client, checkout_data, product):
        url = reverse('orders:orders-checkout')
        response = authenticated_client.post(url, checkout_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'pending'
        assert response.data['payment_method'] == checkout_data['payment_method']
        assert response.data['recipient_name'] == checkout_data['recipient_name']
        
        # 주문이 실제로 생성되었는지 확인
        order_id = response.data['id']
        assert Order.objects.filter(id=order_id).exists()
        
        # 장바구니 상품이 주문으로 이동했는지 확인 (장바구니는 비워져야 함)
        assert not CartItem.objects.filter(id__in=checkout_data['cart_items']).exists()
        
        # 상품 재고가 감소했는지 확인
        product.refresh_from_db()
        assert product.stock == 98  # 원래 100에서 주문 수량 2만큼 감소
    
    def test_order_list(self, authenticated_client, checkout_data):
        # 먼저 주문 생성
        checkout_url = reverse('orders:orders-checkout')
        authenticated_client.post(checkout_url, checkout_data, format='json')
        
        # 주문 목록 조회
        url = reverse('orders:orders-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['status'] == 'pending'
        assert response.data['results'][0]['payment_method'] == checkout_data['payment_method']
    
    def test_order_detail(self, authenticated_client, checkout_data):
        # 먼저 주문 생성
        checkout_url = reverse('orders:orders-checkout')
        checkout_response = authenticated_client.post(checkout_url, checkout_data, format='json')
        order_id = checkout_response.data['id']
        
        # 주문 상세 조회
        url = reverse('orders:orders-detail', kwargs={'pk': order_id})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['id'] == order_id
        assert response.data['status'] == 'pending'
        assert len(response.data['items']) == 1  # 주문 상품이 1개 있어야 함
    
    def test_cancel_order(self, authenticated_client, checkout_data, product):
        # 먼저 주문 생성
        checkout_url = reverse('orders:orders-checkout')
        checkout_response = authenticated_client.post(checkout_url, checkout_data, format='json')
        order_id = checkout_response.data['id']
        
        # 주문 취소
        url = reverse('orders:orders-cancel', kwargs={'pk': order_id})
        response = authenticated_client.post(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'cancelled'
        
        # 주문 상태가 실제로 변경되었는지 확인
        order = Order.objects.get(id=order_id)
        assert order.status == 'cancelled'
        
        # 재고가 복구되었는지 확인 (실제 구현에서는 비동기 태스크이므로 즉시 반영되지 않을 수 있음)
        # 여기서는 테스트를 위해 직접 확인
        # 해당 테스트는 생략하거나 모킹을 통해 비동기 태스크의 실행을 시뮬레이션 해야 함