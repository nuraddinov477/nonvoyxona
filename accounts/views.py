from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Message
from .serializers import UserSerializer, LoginSerializer, MessageSerializer, ProfileSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = authenticate(
        username=serializer.validated_data['username'],
        password=serializer.validated_data['password']
    )
    if user is None:
        return Response({'error': 'Login yoki parol noto\'g\'ri'}, status=status.HTTP_401_UNAUTHORIZED)
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Foydalanuvchining to'liq profili (xodim ma'lumotlari bilan)"""
    return Response(ProfileSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filterset_fields = ['role', 'is_active', 'point']
    search_fields = ['username', 'first_name', 'last_name', 'phone']


class BossChatViewSet(viewsets.ModelViewSet):
    """Faqat admin va menejer kira oladigan yopiq chat"""
    serializer_class = MessageSerializer

    def get_queryset(self):
        if self.request.user.role not in ('admin', 'manager'):
            return Message.objects.none()
        return Message.objects.select_related('sender').all()

    def create(self, request, *args, **kwargs):
        if request.user.role not in ('admin', 'manager'):
            return Response({'error': 'Ruxsat yo\'q'}, status=403)
        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'error': 'Xabar bo\'sh'}, status=400)
        msg = Message.objects.create(sender=request.user, content=content)
        msg.read_by.add(request.user)
        return Response(MessageSerializer(msg, context={'request': request}).data, status=201)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_messages_read(request):
    if request.user.role not in ('admin', 'manager'):
        return Response({'error': 'Ruxsat yo\'q'}, status=403)
    for msg in Message.objects.exclude(read_by=request.user):
        msg.read_by.add(request.user)
    return Response({'ok': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_count(request):
    if request.user.role not in ('admin', 'manager'):
        return Response({'count': 0})
    count = Message.objects.exclude(read_by=request.user).exclude(sender=request.user).count()
    return Response({'count': count})
