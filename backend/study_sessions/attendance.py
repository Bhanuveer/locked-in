from datetime import timedelta

from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from quizzes.models import QuizAttempt

from .models import StudySession

DAYS_WINDOW = 30


class AttendanceView(APIView):
    def get(self, request):
        target = self._resolve_target_student(request)
        if target is None:
            return Response({'detail': 'Student not found or not accessible.'}, status=404)

        since = timezone.localdate() - timedelta(days=DAYS_WINDOW - 1)
        rows = (
            StudySession.objects.filter(student=target, started_at__date__gte=since)
            .annotate(day=TruncDate('started_at'))
            .values('day')
            .annotate(
                session_count=Count('id'),
                completed_count=Count('id', filter=Q(status='completed')),
            )
            .order_by('day')
        )
        by_day = {row['day'].isoformat(): row for row in rows}

        quiz_days = set(
            QuizAttempt.objects.filter(student=target, taken_at__date__gte=since)
            .annotate(day=TruncDate('taken_at'))
            .values_list('day', flat=True)
        )

        days = []
        for i in range(DAYS_WINDOW):
            day = since + timedelta(days=i)
            key = day.isoformat()
            row = by_day.get(key)
            days.append(
                {
                    'date': key,
                    'session_count': row['session_count'] if row else 0,
                    'completed_count': row['completed_count'] if row else 0,
                    'quiz_taken': day in quiz_days,
                }
            )

        profile = target.profile
        return Response(
            {
                'student_username': target.username,
                'streak_days': profile.streak_days,
                'points': profile.points,
                'days': days,
            }
        )

    def _resolve_target_student(self, request):
        user = request.user
        role = user.profile.role
        student_id = request.query_params.get('student')

        if role == 'student':
            return user

        if not student_id:
            return None

        try:
            target = User.objects.get(pk=student_id, profile__role='student')
        except User.DoesNotExist:
            return None

        if role == 'teacher' and target.classes_enrolled.filter(teacher=user).exists():
            return target
        if role == 'parent' and target.linked_parents.filter(parent=user).exists():
            return target
        return None
