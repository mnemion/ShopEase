import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from products.models import Category, Product, Review

@pytest.fixture
def api_client():
    return APIClient()

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

@pytest.mark.django_db
class TestCategoryAPI:
    def test_category_list(self, api_client, category):
        url = reverse('products:category-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['name'] == category.name
    
    def test_category_detail(self, api_client, category):
        url = reverse('products:category-detail', kwargs={'pk': category.pk})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == category.name
        assert response.data['slug'] == category.slug

@pytest.mark.django_db
class TestProductAPI:
    def test_product_list(self, api_client, product):
        url = reverse('products:product-list')
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['name'] == product.name
    
    def test_product_detail(self, api_client, product):
        url = reverse('products:product-detail', kwargs={'pk': product.pk})
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == product.name
        assert response.data['price'] == str(product.price)
    
    def test_product_filter_by_category(self, api_client, product, category):
        url = f"{reverse('products:product-list')}?category={category.pk}"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['category'] == category.pk
    
    def test_product_search(self, api_client, product):
        url = f"{reverse('products:product-list')}?search={product.name[:4]}"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert product.name in response.data['results'][0]['name']
    
    def test_product_price_filter(self, api_client, product):
        url = f"{reverse('products:product-list')}?min_price=5000&max_price=15000"
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        price = float(response.data['results'][0]['price'])
        assert 5000 <= price <= 15000

@pytest.mark.django_db
class TestReviewAPI:
    def test_create_review_unauthorized(self, api_client, product):
        url = reverse('products:product-review', kwargs={'pk': product.pk})
        review_data = {
            'title': '테스트 리뷰',
            'content': '테스트 내용입니다.',
            'rating': 5
        }
        response = api_client.post(url, review_data, format='json')
        
        # 인증되지 않은 사용자는 리뷰를 작성할 수 없음
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_review_authorized(self, api_client, product, django_user_model):
        # 사용자 생성 및 인증
        user = django_user_model.objects.create_user(
            email='test@example.com',
            password='password123'
        )
        api_client.force_authenticate(user=user)
        
        url = reverse('products:product-review', kwargs={'pk': product.pk})
        review_data = {
            'title': '테스트 리뷰',
            'content': '테스트 내용입니다.',
            'rating': 5
        }
        response = api_client.post(url, review_data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == review_data['title']
        assert response.data['rating'] == review_data['rating']
        
        # 리뷰가 DB에 실제로 저장되었는지 확인
        assert Review.objects.filter(product=product, user=user).exists()