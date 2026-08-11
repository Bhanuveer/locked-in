from django.urls import path

from .attendance import AttendanceView
from .views import (
    AnswerQuestionView,
    EndSessionView,
    GenerateQuestionView,
    StartSessionView,
    StudySessionDetailView,
    StudySessionListView,
)

urlpatterns = [
    path('sessions/start/', StartSessionView.as_view(), name='session-start'),
    path('sessions/<int:pk>/end/', EndSessionView.as_view(), name='session-end'),
    path('sessions/', StudySessionListView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', StudySessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:pk>/questions/generate/', GenerateQuestionView.as_view(), name='question-generate'),
    path('sessions/<int:pk>/questions/<int:qid>/answer/', AnswerQuestionView.as_view(), name='question-answer'),
    path('attendance/', AttendanceView.as_view(), name='attendance'),
]
