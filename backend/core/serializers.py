from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from .models import Address

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """사용자 조회/수정용 시리얼라이저"""
    class Meta:
        model = User
        fields = ('id', 'email', 'name', 'phone')
        read_only_fields = ('id', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    """사용자 등록용 시리얼라이저"""
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password2', 'name', 'phone')
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "비밀번호가 일치하지 않습니다."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class AddressSerializer(serializers.ModelSerializer):
    """배송지 시리얼라이저"""
    class Meta:
        model = Address
        fields = ('id', 'name', 'recipient', 'phone', 'zip_code', 
                  'address1', 'address2', 'is_default', 'created_at')
        read_only_fields = ('id', 'created_at')
    
    def create(self, validated_data):
        # 요청한 사용자를 배송지 소유자로 설정
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        email = attrs.get('email')
        password = attrs.get('password')
        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            if not user:
                raise serializers.ValidationError({'detail': '이메일 또는 비밀번호가 올바르지 않습니다.'})
            if not user.is_active:
                raise serializers.ValidationError({'detail': '비활성화된 계정입니다.'})
            attrs['user'] = user
        else:
            raise serializers.ValidationError({'detail': '이메일과 비밀번호를 모두 입력해주세요.'})
        return attrs

class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        User = get_user_model()
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('해당 이메일로 가입된 사용자가 없습니다.')
        return value

    def save(self):
        from django.core.mail import send_mail
        from django.utils.crypto import get_random_string
        User = get_user_model()
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        temp_password = get_random_string(length=8)
        user.set_password(temp_password)
        user.save()
        send_mail(
            '[ShopEase] 임시 비밀번호 안내',
            f'임시 비밀번호: {temp_password}\n로그인 후 반드시 비밀번호를 변경해주세요.',
            'noreply@shopease.com',
            [email],
            fail_silently=False,
        )
        return user