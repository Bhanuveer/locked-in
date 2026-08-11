from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import LinkChildView, MeView, MyChildrenView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('parent/link-request/', LinkChildView.as_view(), name='link-request'),
    path('parent/children/', MyChildrenView.as_view(), name='parent-children'),
]
