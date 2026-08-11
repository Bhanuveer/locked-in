from rest_framework import serializers

from .models import Quiz, QuizAnswer, QuizAttempt, QuizQuestion


class QuizQuestionPublicSerializer(serializers.ModelSerializer):
    """Used before a student has attempted the quiz — hides the correct answer."""

    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'order']


class QuizQuestionFullSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'order']


class QuizSerializer(serializers.ModelSerializer):
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    question_count = serializers.IntegerField(source='questions.count', read_only=True)
    my_attempt_score = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id', 'classroom', 'classroom_name', 'homework', 'title', 'topic',
            'created_by', 'created_at', 'question_count', 'my_attempt_score',
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_my_attempt_score(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        attempt = obj.attempts.filter(student=request.user).first()
        if not attempt:
            return None
        return {'score': attempt.score, 'total': attempt.total_questions}


class QuizDetailSerializer(QuizSerializer):
    questions = serializers.SerializerMethodField()

    class Meta(QuizSerializer.Meta):
        fields = QuizSerializer.Meta.fields + ['questions']

    def get_questions(self, obj):
        request = self.context.get('request')
        already_attempted = request and obj.attempts.filter(student=request.user).exists()
        is_teacher = request and request.user.profile.role == 'teacher'
        serializer_class = QuizQuestionFullSerializer if (already_attempted or is_teacher) else QuizQuestionPublicSerializer
        return serializer_class(obj.questions.all(), many=True).data


class QuizAnswerInputSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option = serializers.ChoiceField(choices=['A', 'B', 'C', 'D'])


class QuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAnswer
        fields = ['question', 'selected_option', 'is_correct']


class QuizAttemptSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(source='student.username', read_only=True)
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    answers = QuizAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'quiz_title', 'student', 'student_username', 'score', 'total_questions', 'taken_at', 'answers']
        read_only_fields = ['student', 'score', 'total_questions', 'taken_at']
