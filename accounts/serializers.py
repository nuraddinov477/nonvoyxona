from rest_framework import serializers
from .models import User, Message


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


class ProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    employee = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role',
                  'role_display', 'phone', 'date_joined', 'employee']

    def get_employee(self, obj):
        emp = getattr(obj, 'hr_profile', None)
        if not emp:
            return None
        return {
            'position': emp.position.name if emp.position else None,
            'salary_type': emp.position.get_salary_type_display() if emp.position else None,
            'fixed_salary': float(emp.fixed_salary or 0),
            'hire_date': emp.hire_date,
            'address': emp.address,
            'status': emp.get_status_display(),
        }


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ['id', 'content', 'created_at', 'sender', 'sender_name', 'sender_role', 'is_mine']
        read_only_fields = ['sender', 'created_at']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.id == obj.sender_id)
