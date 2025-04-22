from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartItemViewSet, OrderViewSet

app_name = 'orders'

router = DefaultRouter()
router.register(r'cart', CartItemViewSet, basename='cart')
router.register(r'', OrderViewSet, basename='orders')

urlpatterns = [
    path('', include(router.urls)),
]