from django.urls import path

from .views import GenerateQuizView, QuizAttemptListView, QuizDetailView, QuizListView, SubmitQuizAttemptView

urlpatterns = [
    path('quizzes/generate/', GenerateQuizView.as_view(), name='quiz-generate'),
    path('quizzes/', QuizListView.as_view(), name='quiz-list'),
    path('quizzes/<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('quizzes/<int:pk>/attempt/', SubmitQuizAttemptView.as_view(), name='quiz-attempt'),
    path('quizzes/<int:pk>/attempts/', QuizAttemptListView.as_view(), name='quiz-attempts'),
]
