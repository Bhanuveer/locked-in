from django.contrib.auth.models import User
from rest_framework import serializers

from .models import ParentStudentLink, Profile


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=Profile.ROLE_CHOICES)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        Profile.objects.create(user=user, role=validated_data['role'])
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='profile.role', read_only=True)
    invite_code = serializers.CharField(source='profile.invite_code', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'invite_code']


class ParentStudentLinkSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    parent_username = serializers.CharField(source='parent.username', read_only=True)

    class Meta:
        model = ParentStudentLink
        fields = ['id', 'parent', 'student', 'parent_username', 'student_username', 'invite_status', 'created_at']
        read_only_fields = ['parent', 'invite_status', 'created_at']
