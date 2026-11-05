
from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", views.LoginView.as_view()),
    path("auth/me/", views.MeView.as_view()),
    path("auth/password/", views.PasswordView.as_view()),

    # Lookup
    path("schools/", views.SchoolList.as_view()),
    path("departments/", views.DepartmentList.as_view()),
    path("courses/", views.CourseList.as_view()),
    path("technologies/", views.TechnologyList.as_view()),
    path("students/", views.StudentSearch.as_view()),
    path("supervisors/", views.SupervisorList.as_view()),

    # Admin
    path("admin/supervisors/", views.AdminSupervisorCreate.as_view()),

    # Projects
    path("projects/", views.ProjectListCreate.as_view()),
    path("projects/<int:pk>/", views.ProjectDetail.as_view()),
    path("projects/<int:pk>/comments/", views.ProjectComments.as_view()),
    path("projects/<int:pk>/review/", views.ProjectReview.as_view()),

    # Notifications
    path("notifications/", views.NotificationList.as_view()),
    path("notifications/read/", views.NotificationRead.as_view()),
    path("notifications/<int:pk>/read/", views.NotificationRead.as_view()),

    # Statistics
    path("stats/", views.StatsView.as_view()),
]
