from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    point_name = serializers.CharField(source='point.name', read_only=True, default=None)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role',
                  'role_display', 'phone', 'point', 'point_name', 'is_active']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
