from django.contrib import admin

from .models import ClassRoom, Homework, HomeworkChatMessage

admin.site.register(ClassRoom)
admin.site.register(Homework)
admin.site.register(HomeworkChatMessage)
