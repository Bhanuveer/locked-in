from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.rewards import award_points

from . import ai_engine
from .models import SessionQuestion, StudySession
from .serializers import SessionQuestionSerializer, StudySessionSerializer

POINTS_PER_COMPLETED_SESSION = 15
POINTS_PER_CORRECT_ANSWER = 5


class StudySessionListView(generics.ListAPIView):
    serializer_class = StudySessionSerializer

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        qs = StudySession.objects.all().order_by('-started_at')
        if role == 'student':
            return qs.filter(student=user)
        if role == 'teacher':
            return qs.filter(student__classes_enrolled__teacher=user).distinct()
        if role == 'parent':
            return qs.filter(student__linked_parents__parent=user).distinct()
        return qs.none()


class StudySessionDetailView(generics.RetrieveAPIView):
    serializer_class = StudySessionSerializer

    def get_queryset(self):
        return StudySession.objects.all()


class StartSessionView(generics.CreateAPIView):
    serializer_class = StudySessionSerializer

    def perform_create(self, serializer):
        if self.request.user.profile.role != 'student':
            raise PermissionDenied('Only students can start sessions.')
        serializer.save(student=self.request.user, status='in_progress')


class EndSessionView(APIView):
    def post(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk, student=request.user)
        except StudySession.DoesNotExist:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'in_progress':
            return Response({'detail': 'Session already ended.'}, status=status.HTTP_400_BAD_REQUEST)

        completed = request.data.get('completed', True)
        session.ended_at = timezone.now()
        elapsed_minutes = int((session.ended_at - session.started_at).total_seconds() // 60)
        session.actual_duration_minutes = elapsed_minutes
        session.status = 'completed' if completed else 'abandoned'
        if not completed:
            session.abandon_reason = request.data.get('reason', '')
        session.save()

        if completed:
            award_points(request.user.profile, POINTS_PER_COMPLETED_SESSION, mark_active_today=True)

        return Response(StudySessionSerializer(session).data)


class ParseVoiceCommandView(APIView):
    def post(self, request):
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'detail': 'text is required.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ai_engine.parse_voice_command(text))


class GenerateQuestionView(APIView):
    def post(self, request, pk):
        try:
            session = StudySession.objects.get(pk=pk, student=request.user)
        except StudySession.DoesNotExist:
            return Response({'detail': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)

        if session.status != 'in_progress':
            return Response({'detail': 'Session is not active.'}, status=status.HTTP_400_BAD_REQUEST)

        question_text = ai_engine.generate_question(session.subject, session.topic)
        question = SessionQuestion.objects.create(session=session, question_text=question_text)
        return Response(SessionQuestionSerializer(question).data, status=status.HTTP_201_CREATED)


class AnswerQuestionView(APIView):
    def post(self, request, pk, qid):
        try:
            question = SessionQuestion.objects.get(pk=qid, session_id=pk, session__student=request.user)
        except SessionQuestion.DoesNotExist:
            return Response({'detail': 'Question not found.'}, status=status.HTTP_404_NOT_FOUND)

        if question.is_correct is not None:
            return Response({'detail': 'Question already answered.'}, status=status.HTTP_400_BAD_REQUEST)

        answer = request.data.get('answer', '')
        session = question.session
        is_correct, feedback = ai_engine.check_answer(session.subject, session.topic, question.question_text, answer)

        question.student_answer = answer
        question.is_correct = is_correct
        question.ai_feedback = feedback
        question.answered_at = timezone.now()
        question.save()

        if is_correct:
            award_points(request.user.profile, POINTS_PER_CORRECT_ANSWER, mark_active_today=True)

        return Response(SessionQuestionSerializer(question).data)
