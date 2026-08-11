from django.conf import settings
from django.db import models

from classroom.models import Homework


class StudySession(models.Model):
    STATUS_CHOICES = [
        ('in_progress', 'In progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='study_sessions')
    subject = models.CharField(max_length=100)
    topic = models.CharField(max_length=200)
    homework = models.ForeignKey(Homework, on_delete=models.SET_NULL, null=True, blank=True, related_name='sessions')
    planned_duration_minutes = models.PositiveIntegerField()
    actual_duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='in_progress')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    abandon_reason = models.TextField(blank=True)

    def __str__(self):
        return f'{self.student.username} - {self.subject}/{self.topic} ({self.status})'


class SessionQuestion(models.Model):
    session = models.ForeignKey(StudySession, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    student_answer = models.TextField(blank=True)
    is_correct = models.BooleanField(null=True)
    ai_feedback = models.TextField(blank=True)
    asked_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'Q for session {self.session_id}'
