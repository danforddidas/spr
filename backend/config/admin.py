from django.contrib import admin
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Course, Department, Notification, Project, School, Technology, User


@admin.register(User)
class SPRUserAdmin(UserAdmin):
    # UserAdmin ya kawaida + fields zetu (role, reg_number, ...)
    list_display = ("username", "full_name", "role", "reg_number", "department", "is_staff")
    list_filter = ("role", "department")
    search_fields = ("username", "first_name", "last_name", "reg_number", "email")
    fieldsets = UserAdmin.fieldsets + (
        ("SPR profile", {"fields": ("role", "reg_number", "phone", "department", "course")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("SPR profile", {"fields": ("role", "reg_number", "phone", "department", "course")}),
    )


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "year", "course", "submission_type", "leader", "created_at")
    list_filter = ("year", "submission_type", "technologies")
    search_fields = ("title", "description")
    filter_horizontal = ("technologies", "members", "supervisors")


admin.site.register(School)
admin.site.register(Department)
admin.site.register(Course)
admin.site.register(Technology)
admin.site.register(Notification)
# Register your models here.
