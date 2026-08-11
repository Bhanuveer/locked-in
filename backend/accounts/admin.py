from django.contrib import admin

from .models import ParentStudentLink, Profile

admin.site.register(Profile)
admin.site.register(ParentStudentLink)
