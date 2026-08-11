from django.contrib import admin

from .models import SessionQuestion, StudySession

admin.site.register(StudySession)
admin.site.register(SessionQuestion)
