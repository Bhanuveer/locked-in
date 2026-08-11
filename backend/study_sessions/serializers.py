from rest_framework import serializers

from .models import SessionQuestion, StudySession


class SessionQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionQuestion
        fields = ['id', 'session', 'question_text', 'student_answer', 'is_correct', 'ai_feedback', 'asked_at', 'answered_at']
        read_only_fields = ['session', 'question_text', 'is_correct', 'ai_feedback', 'asked_at', 'answered_at']


class StudySessionSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    questions = SessionQuestionSerializer(many=True, read_only=True)
    questions_asked = serializers.IntegerField(source='questions.count', read_only=True)
    questions_correct = serializers.SerializerMethodField()

    class Meta:
        model = StudySession
        fields = [
            'id', 'student', 'student_username', 'subject', 'topic', 'homework',
            'planned_duration_minutes', 'actual_duration_minutes', 'status',
            'started_at', 'ended_at', 'questions', 'questions_asked', 'questions_correct',
        ]
        read_only_fields = ['student', 'actual_duration_minutes', 'status', 'started_at', 'ended_at']

    def get_questions_correct(self, obj):
        return obj.questions.filter(is_correct=True).count()
