from django.urls import path

from .views import AddStudentToClassView, ClassRoomListCreateView, HomeworkAssistantView, HomeworkListCreateView

urlpatterns = [
    path('classes/', ClassRoomListCreateView.as_view(), name='classes'),
    path('classes/<int:pk>/students/', AddStudentToClassView.as_view(), name='class-add-student'),
    path('homework/', HomeworkListCreateView.as_view(), name='homework'),
    path('homework/<int:pk>/assistant/', HomeworkAssistantView.as_view(), name='homework-assistant'),
]
