import json
import traceback
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async  # DB 작업 필요시 사용
from channels.exceptions import StopConsumer
from django.core.serializers.json import DjangoJSONEncoder
from django.conf import settings

class CategoryConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """클라이언트가 웹소켓 연결을 요청할 때 호출됩니다."""
        try:
            # Consumer 인스턴스에 그룹 이름 저장
            self.group_name = 'category_updates'  # 이 Consumer가 속할 그룹 이름
            print("WebSocket 연결 시도")

            # 그룹에 참여 (Join)
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name  # 각 클라이언트 연결의 고유 식별자
            )

            # 연결 수락 (중요: 이 부분이 실행되어야 WebSocket 핸드셰이크가 완료됨)
            await self.accept()
            print(f"WebSocket 연결 성공, group: {self.group_name}")
            
            # 연결 확인 메시지 전송 (옵션)
            await self.send(text_data=json.dumps({
                'type': 'connection_established',
                'message': 'WebSocket 연결이 성공적으로 설정되었습니다.'
            }))
            
            # 현재 카테고리 목록을 확인하기 위한 명령 추가
            @database_sync_to_async
            def get_current_categories():
                from products.models import Category
                
                # 모든 카테고리 가져오기
                categories = list(Category.objects.values('id', 'name', 'is_active', 'parent', 'order', 'image', 'slug'))
                
                # 이미지 URL 추가
                for category in categories:
                    if category['image']:
                        if settings.DEBUG:
                            category['image_url'] = f"{settings.MEDIA_URL}{category['image']}"
                        else:
                            # 프로덕션 환경에서 CDN URL이 있으면 사용
                            category['image_url'] = f"{settings.MEDIA_URL}{category['image']}"
                
                return categories
            
            categories = await get_current_categories()
            print(f"현재 카테고리 목록(WebSocket 연결 시점): {categories}")
            
            # 클라이언트에 카테고리 목록 전송 (선택사항)
            await self.send(text_data=json.dumps({
                'type': 'categories_list',
                'message': '연결 시점의, 서버의 현재 카테고리 목록입니다',
                'categories': categories
            }, cls=DjangoJSONEncoder))
            
        except Exception as e:
            print(f"WebSocket 연결 오류: {str(e)}")
            traceback.print_exc()
            raise StopConsumer()

    async def disconnect(self, close_code):
        """클라이언트 연결이 끊어졌을 때 호출됩니다."""
        try:
            print(f"WebSocket disconnected: {self.channel_name}, code: {close_code}")
            # 그룹에서 떠나기 (Leave)
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
        except Exception as e:
            print(f"WebSocket 연결 종료 중 오류: {str(e)}")
            traceback.print_exc()

    # 클라이언트로부터 메시지 수신 시 호출 (필요한 경우)
    async def receive(self, text_data):
        """클라이언트로부터 메시지를 받았을 때 호출됩니다."""
        try:
            print(f"메시지 수신: {text_data}")
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type', '')
            
            # 핑-퐁 메시지 처리 (필요시)
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'data': text_data_json.get('data', {})
                }))
        except Exception as e:
            print(f"메시지 수신 중 오류: {str(e)}")
            traceback.print_exc()

    # 그룹으로부터 메시지를 수신했을 때 호출될 메서드
    # channel_layer.group_send 호출 시 'type' 키에 지정된 이름과 같아야 함 (점(.)은 밑줄(_)로 변환)
    async def category_update_message(self, event):
        """그룹에서 'category.update.message' 타입의 메시지를 받으면 실행됩니다."""
        try:
            message = event['message']
            print(f"============= 카테고리 업데이트 메시지 =============")
            print(f"Group: {self.group_name}")
            print(f"메시지 내용: {message}")
            
            # 디버그용: 액션 타입에 따라 다른 메시지 출력
            action = message.get('action', 'unknown')
            category_id = message.get('id', 'unknown')
            category_name = message.get('name', 'unknown')
            is_active = message.get('is_active', 'unknown')
            
            print(f"액션: {action}, ID: {category_id}, 이름: {category_name}, 활성화: {is_active}")

            # 웹소켓 클라이언트에게 JSON 형태로 메시지 전송
            await self.send(text_data=json.dumps({
                'type': 'category_update',  # 프론트엔드에서 식별할 타입
                'payload': message         # 실제 데이터 (예: {'action': 'delete', 'id': 10})
            }))
            print(f"클라이언트에 메시지 전송 완료: {message}")
            print(f"============= 메시지 처리 완료 =============")
        except Exception as e:
            print(f"메시지 전송 중 오류: {str(e)}")
            traceback.print_exc() 