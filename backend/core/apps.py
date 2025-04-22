from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = '사용자 관리'
    
    def ready(self):
        """앱이 준비될 때 실행되는 메서드"""
        logger.info("="*30)
        logger.info("Executing CoreConfig.ready()...")
        logger.info("="*30)

        # 시그널 등록
        try:
            import core.signals
            logger.info("Successfully imported core.signals.")
        except Exception as e:
            logger.error(f"Error importing core.signals: {e}", exc_info=True)

        logger.info("="*30)
        logger.info("CoreConfig.ready() finished.")
        logger.info("="*30)