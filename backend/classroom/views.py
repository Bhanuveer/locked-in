from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ClassRoom, Homework
from .serializers import ClassRoomSerializer, HomeworkSerializer


class ClassRoomListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassRoomSerializer

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        if role == 'teacher':
            return ClassRoom.objects.filter(teacher=user)
        if role == 'student':
            return ClassRoom.objects.filter(students=user)
        return ClassRoom.objects.none()

    def perform_create(self, serializer):
        if self.request.user.profile.role != 'teacher':
            raise permissions.exceptions.PermissionDenied('Only teachers can create classes.')
        serializer.save(teacher=self.request.user)


class AddStudentToClassView(APIView):
    def post(self, request, pk):
        try:
            classroom = ClassRoom.objects.get(pk=pk, teacher=request.user)
        except ClassRoom.DoesNotExist:
            return Response({'detail': 'Class not found.'}, status=status.HTTP_404_NOT_FOUND)

        username = request.data.get('username')
        try:
            student = User.objects.get(username=username, profile__role='student')
        except User.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        classroom.students.add(student)
        return Response(ClassRoomSerializer(classroom).data)


class HomeworkListCreateView(generics.ListCreateAPIView):
    serializer_class = HomeworkSerializer

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        if role == 'teacher':
            return Homework.objects.filter(classroom__teacher=user)
        if role == 'student':
            return Homework.objects.filter(classroom__students=user)
        if role == 'parent':
            return Homework.objects.filter(classroom__students__linked_parents__parent=user)
        return Homework.objects.none()

    def perform_create(self, serializer):
        if self.request.user.profile.role != 'teacher':
            raise permissions.exceptions.PermissionDenied('Only teachers can assign homework.')
        classroom = serializer.validated_data['classroom']
        if classroom.teacher != self.request.user:
            raise permissions.exceptions.PermissionDenied('Not your class.')
        serializer.save(created_by=self.request.user)
