from django.db import transaction
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.rewards import award_points
from classroom.models import ClassRoom, Homework

from . import ai_engine
from .models import Quiz, QuizAnswer, QuizAttempt, QuizQuestion
from .serializers import (
    QuizAnswerInputSerializer,
    QuizAttemptSerializer,
    QuizDetailSerializer,
    QuizSerializer,
)

POINTS_PER_CORRECT_QUIZ_ANSWER = 5


class GenerateQuizView(APIView):
    def post(self, request):
        if request.user.profile.role != 'teacher':
            raise PermissionDenied('Only teachers can generate quizzes.')

        classroom_id = request.data.get('classroom')
        homework_id = request.data.get('homework')
        num_questions = int(request.data.get('num_questions', 15))
        title = request.data.get('title', '').strip()

        try:
            classroom = ClassRoom.objects.get(pk=classroom_id, teacher=request.user)
        except ClassRoom.DoesNotExist:
            return Response({'detail': 'Class not found.'}, status=status.HTTP_404_NOT_FOUND)

        homework = None
        if homework_id:
            homework = Homework.objects.filter(pk=homework_id, classroom=classroom).first()

        if homework:
            topics = [homework.topic]
            subject = homework.title
        else:
            topics = list(classroom.homework.values_list('topic', flat=True).distinct()) or [classroom.name]
            subject = classroom.name

        if not title:
            title = f'{"Quiz: " + homework.topic if homework else "Quiz: " + classroom.name}'

        generated = ai_engine.generate_mcq_quiz(subject, topics, num_questions)

        with transaction.atomic():
            quiz = Quiz.objects.create(
                classroom=classroom, homework=homework, title=title,
                topic=', '.join(topics), created_by=request.user,
            )
            for i, q in enumerate(generated):
                QuizQuestion.objects.create(
                    quiz=quiz,
                    question_text=q.get('question', ''),
                    option_a=q.get('option_a', ''),
                    option_b=q.get('option_b', ''),
                    option_c=q.get('option_c', ''),
                    option_d=q.get('option_d', ''),
                    correct_option=q.get('correct_option', 'A'),
                    order=i,
                )

        return Response(QuizDetailSerializer(quiz, context={'request': request}).data, status=status.HTTP_201_CREATED)


class QuizListView(generics.ListAPIView):
    serializer_class = QuizSerializer

    def get_queryset(self):
        user = self.request.user
        role = user.profile.role
        qs = Quiz.objects.all().order_by('-created_at')
        if role == 'teacher':
            return qs.filter(classroom__teacher=user)
        if role == 'student':
            return qs.filter(classroom__students=user)
        if role == 'parent':
            return qs.filter(classroom__students__linked_parents__parent=user).distinct()
        return qs.none()

    def get_serializer_context(self):
        return {'request': self.request}


class QuizDetailView(generics.RetrieveAPIView):
    serializer_class = QuizDetailSerializer
    queryset = Quiz.objects.all()

    def get_serializer_context(self):
        return {'request': self.request}


class SubmitQuizAttemptView(APIView):
    def post(self, request, pk):
        try:
            quiz = Quiz.objects.get(pk=pk, classroom__students=request.user)
        except Quiz.DoesNotExist:
            return Response({'detail': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

        if QuizAttempt.objects.filter(quiz=quiz, student=request.user).exists():
            return Response({'detail': 'You already attempted this quiz.'}, status=status.HTTP_400_BAD_REQUEST)

        answers_input = QuizAnswerInputSerializer(data=request.data.get('answers', []), many=True)
        answers_input.is_valid(raise_exception=True)

        questions = {q.id: q for q in quiz.questions.all()}
        score = 0
        answer_objs = []
        for item in answers_input.validated_data:
            question = questions.get(item['question_id'])
            if not question:
                continue
            is_correct = question.correct_option == item['selected_option']
            if is_correct:
                score += 1
            answer_objs.append((question, item['selected_option'], is_correct))

        with transaction.atomic():
            attempt = QuizAttempt.objects.create(
                quiz=quiz, student=request.user, score=score, total_questions=len(questions)
            )
            QuizAnswer.objects.bulk_create(
                [
                    QuizAnswer(attempt=attempt, question=q, selected_option=opt, is_correct=correct)
                    for q, opt, correct in answer_objs
                ]
            )

        award_points(request.user.profile, score * POINTS_PER_CORRECT_QUIZ_ANSWER, mark_active_today=True)

        return Response(QuizAttemptSerializer(attempt).data, status=status.HTTP_201_CREATED)


class QuizAttemptListView(generics.ListAPIView):
    serializer_class = QuizAttemptSerializer

    def get_queryset(self):
        quiz = Quiz.objects.filter(pk=self.kwargs['pk']).first()
        if not quiz:
            return QuizAttempt.objects.none()
        user = self.request.user
        role = user.profile.role
        if role == 'teacher' and quiz.classroom.teacher == user:
            return quiz.attempts.all().order_by('-taken_at')
        if role == 'parent':
            return quiz.attempts.filter(student__linked_parents__parent=user)
        return QuizAttempt.objects.none()
