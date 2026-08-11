from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from . import ai_assistant
from .models import ClassRoom, Homework, HomeworkChatMessage
from .serializers import ClassRoomSerializer, HomeworkChatMessageSerializer, HomeworkSerializer


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


class HomeworkAssistantView(APIView):
    def get(self, request, pk):
        homework = self._get_homework(request, pk)
        if not homework:
            return Response({'detail': 'Homework not found.'}, status=status.HTTP_404_NOT_FOUND)
        messages = HomeworkChatMessage.objects.filter(homework=homework, student=request.user)
        return Response(HomeworkChatMessageSerializer(messages, many=True).data)

    def post(self, request, pk):
        if request.user.profile.role != 'student':
            raise permissions.exceptions.PermissionDenied('Only students can use the homework assistant.')

        homework = self._get_homework(request, pk)
        if not homework:
            return Response({'detail': 'Homework not found.'}, status=status.HTTP_404_NOT_FOUND)

        message = request.data.get('message', '').strip()
        if not message:
            return Response({'detail': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        history = list(HomeworkChatMessage.objects.filter(homework=homework, student=request.user))
        user_msg = HomeworkChatMessage.objects.create(
            homework=homework, student=request.user, role='user', content=message
        )
        reply_text = ai_assistant.ask_homework_assistant(homework, history, message)
        assistant_msg = HomeworkChatMessage.objects.create(
            homework=homework, student=request.user, role='assistant', content=reply_text
        )
        return Response(
            HomeworkChatMessageSerializer([user_msg, assistant_msg], many=True).data,
            status=status.HTTP_201_CREATED,
        )

    def _get_homework(self, request, pk):
        return Homework.objects.filter(pk=pk, classroom__students=request.user).first()
