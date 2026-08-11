from django.urls import path

from .views import AddStudentToClassView, ClassRoomListCreateView, HomeworkListCreateView

urlpatterns = [
    path('classes/', ClassRoomListCreateView.as_view(), name='classes'),
    path('classes/<int:pk>/students/', AddStudentToClassView.as_view(), name='class-add-student'),
    path('homework/', HomeworkListCreateView.as_view(), name='homework'),
]
