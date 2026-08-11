from django.conf import settings
from django.db import models


class ClassRoom(models.Model):
    name = models.CharField(max_length=100)
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='classes_taught')
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='classes_enrolled', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Homework(models.Model):
    classroom = models.ForeignKey(ClassRoom, on_delete=models.CASCADE, related_name='homework')
    title = models.CharField(max_length=200)
    topic = models.CharField(max_length=200)
    reference_text = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='homework_created')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.title} ({self.classroom.name})'


class HomeworkChatMessage(models.Model):
    ROLE_CHOICES = [('user', 'Student'), ('assistant', 'AI Assistant')]

    homework = models.ForeignKey(Homework, on_delete=models.CASCADE, related_name='chat_messages')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='homework_chats')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'{self.role} message on homework {self.homework_id}'
