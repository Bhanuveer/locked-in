import secrets

from django.conf import settings
from django.db import models


class Profile(models.Model):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('parent', 'Parent'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    invite_code = models.CharField(max_length=12, unique=True, blank=True)
    points = models.PositiveIntegerField(default=0)
    streak_days = models.PositiveIntegerField(default=0)
    last_active_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = secrets.token_hex(4)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.user.username} ({self.role})'

    @property
    def reward_tier(self):
        if self.points >= 500:
            return 'gold'
        if self.points >= 150:
            return 'silver'
        if self.points >= 30:
            return 'bronze'
        return 'none'


class ParentStudentLink(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
    ]

    parent = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='linked_children')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='linked_parents')
    invite_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='accepted')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('parent', 'student')

    def __str__(self):
        return f'{self.parent.username} -> {self.student.username} ({self.invite_status})'
