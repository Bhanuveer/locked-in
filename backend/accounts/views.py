from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import ParentStudentLink, Profile
from .serializers import ParentStudentLinkSerializer, RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LinkChildView(APIView):
    def post(self, request):
        if request.user.profile.role != 'parent':
            return Response({'detail': 'Only parents can link to a student.'}, status=status.HTTP_403_FORBIDDEN)

        invite_code = request.data.get('invite_code', '')
        try:
            student_profile = Profile.objects.get(invite_code=invite_code, role='student')
        except Profile.DoesNotExist:
            return Response({'detail': 'Invalid invite code.'}, status=status.HTTP_404_NOT_FOUND)

        link, created = ParentStudentLink.objects.get_or_create(
            parent=request.user, student=student_profile.user, defaults={'invite_status': 'accepted'}
        )
        return Response(ParentStudentLinkSerializer(link).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class MyChildrenView(generics.ListAPIView):
    serializer_class = ParentStudentLinkSerializer

    def get_queryset(self):
        return ParentStudentLink.objects.filter(parent=self.request.user)
