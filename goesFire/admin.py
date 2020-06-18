from django.contrib import admin
from .models import Profile, CAfire, FdfcFiles, GoesFireTable, GoesImages, Alert

class UserAdmin(admin.ModelAdmin):
    fields = ["first_name",
              "last_name",
              "email",
              ""]


admin.site.register(Profile)
admin.site.register(CAfire)
admin.site.register(FdfcFiles)
admin.site.register(GoesImages)
admin.site.register(GoesFireTable)
admin.site.register(Alert)
