from django.apps import AppConfig


class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'products'
    verbose_name = '상품 관리'
    
    def ready(self):
        """앱이 준비될 때 실행되는 메서드"""
        # 시그널 등록
        import products.signals