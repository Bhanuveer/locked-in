from django.contrib.auth.models import User
from rest_framework import serializers

from .models import ClassRoom, Homework, HomeworkChatMessage


class StudentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


class ClassRoomSerializer(serializers.ModelSerializer):
    teacher_username = serializers.CharField(source='teacher.username', read_only=True)
    students = StudentMiniSerializer(many=True, read_only=True)
    student_count = serializers.IntegerField(source='students.count', read_only=True)

    class Meta:
        model = ClassRoom
        fields = ['id', 'name', 'teacher', 'teacher_username', 'students', 'student_count', 'created_at']
        read_only_fields = ['teacher', 'created_at']


class HomeworkSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)

    class Meta:
        model = Homework
        fields = ['id', 'classroom', 'classroom_name', 'title', 'topic', 'reference_text', 'due_date', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']


class HomeworkChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkChatMessage
        fields = ['id', 'homework', 'role', 'content', 'created_at']
        read_only_fields = ['homework', 'role', 'created_at']
