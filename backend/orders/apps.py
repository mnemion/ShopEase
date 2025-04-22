from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'orders'
    verbose_name = '주문 관리'
    
    def ready(self):
        """앱이 준비될 때 실행되는 메서드"""
        # 시그널 등록
        import orders.signals