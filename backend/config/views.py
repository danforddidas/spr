
from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Comment,
    Course,
    Department,
    Notification,
    Project,
    School,
    Technology,
    User,
)

from .serializers import (
    ChangePasswordSerializer,
    CommentSerializer,
    CourseSerializer,
    DepartmentSerializer,
    LoginSerializer,
    NotificationSerializer,
    ProfileUpdateSerializer,
    ProjectCreateSerializer,
    ProjectSerializer,
    RegisterSerializer,
    SchoolSerializer,
    SupervisorCreateSerializer,
    TechnologySerializer,
    UserBriefSerializer,
    UserSerializer,
)


# ---------------------------------------------------------
# PERMISSIONS
# ---------------------------------------------------------

class IsAdminRole(permissions.BasePermission):

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and (
                user.is_staff
                or user.role == User.ADMIN
            )
        )


# ---------------------------------------------------------
# AUTHENTICATION
# ---------------------------------------------------------

class RegisterView(APIView):

    permission_classes = [permissions.AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        token, _ = Token.objects.get_or_create(user=user)

        return Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):

    permission_classes = [permissions.AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        # Student, Supervisor and Admin login normally.
        # No OTP required.

        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": UserSerializer(user).data,
        })


class MeView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):

        return Response(
            UserSerializer(request.user).data
        )

    def patch(self, request):

        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            UserSerializer(request.user).data
        )


class PasswordView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):

        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        request.user.set_password(
            serializer.validated_data["new_password"]
        )

        request.user.save()

        # Remove old token after password change.
        Token.objects.filter(user=request.user).delete()

        return Response({"ok": True})


# ---------------------------------------------------------
# LOOKUP ENDPOINTS
# ---------------------------------------------------------

class NoPagination:
    pagination_class = None


class SchoolList(NoPagination, generics.ListAPIView):

    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [permissions.AllowAny]


class DepartmentList(NoPagination, generics.ListAPIView):

    serializer_class = DepartmentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):

        queryset = Department.objects.select_related("school")

        school = self.request.query_params.get("school")

        if school:
            queryset = queryset.filter(school_id=school)

        return queryset


class CourseList(NoPagination, generics.ListAPIView):

    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):

        queryset = Course.objects.select_related("department")

        department = self.request.query_params.get("department")

        if department:
            queryset = queryset.filter(
                department_id=department
            )

        return queryset


class TechnologyList(NoPagination, generics.ListAPIView):

    queryset = Technology.objects.all()
    serializer_class = TechnologySerializer
    permission_classes = [permissions.AllowAny]


class StudentSearch(NoPagination, generics.ListAPIView):

    serializer_class = UserBriefSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        queryset = User.objects.filter(
            role=User.STUDENT
        ).exclude(pk=self.request.user.pk)

        query = self.request.query_params.get(
            "search", ""
        ).strip()

        if query:

            queryset = queryset.filter(
                Q(first_name__icontains=query)
                | Q(last_name__icontains=query)
                | Q(reg_number__icontains=query)
            )

        return queryset.order_by("first_name")[:25]


class SupervisorList(NoPagination, generics.ListAPIView):

    serializer_class = UserBriefSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        queryset = User.objects.filter(
            role=User.SUPERVISOR
        )

        department = self.request.query_params.get(
            "department"
        )

        if department:

            queryset = queryset.filter(
                department_id=department
            )

        return queryset.order_by("first_name")


class AdminSupervisorCreate(generics.CreateAPIView):

    serializer_class = SupervisorCreateSerializer
    permission_classes = [IsAdminRole]


# ---------------------------------------------------------
# PROJECT LIST, SEARCH AND SUBMISSION
# ---------------------------------------------------------

class ProjectListCreate(generics.ListCreateAPIView):

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser,
    ]

    def get_serializer_class(self):

        if self.request.method == "POST":
            return ProjectCreateSerializer

        return ProjectSerializer

    def get_serializer_context(self):

        return {
            **super().get_serializer_context(),
            "request": self.request,
        }

    def get_queryset(self):

        queryset = (
            Project.objects
            .select_related(
                "course__department__school",
                "leader",
            )
            .prefetch_related(
                "technologies",
                "members",
                "supervisors",
                "attachments",
            )
        )

        params = self.request.query_params
        user = self.request.user

        if (
            user.is_authenticated
            and user.role == User.SUPERVISOR
        ):

            queryset = queryset.filter(
                supervisors=user
            )

        if params.get("technology"):

            queryset = queryset.filter(
                technologies__id=params["technology"]
            )

        if params.get("course"):

            queryset = queryset.filter(
                course_id=params["course"]
            )

        if params.get("department"):

            queryset = queryset.filter(
                course__department_id=params["department"]
            )

        if params.get("year"):

            queryset = queryset.filter(
                year=params["year"]
            )

        if (
            params.get("mine") == "1"
            and user.is_authenticated
        ):

            queryset = queryset.filter(
                Q(leader=user)
                | Q(members=user)
                | Q(supervisors=user)
            )

        query = params.get("search", "").strip()

        if query:

            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(description__icontains=query)
                | Q(technologies__name__icontains=query)
                | Q(course__name__icontains=query)
                | Q(leader__first_name__icontains=query)
                | Q(leader__last_name__icontains=query)
            )

        return queryset.distinct()

    def create(self, request, *args, **kwargs):

        serializer = ProjectCreateSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        project = serializer.save()

        output = ProjectSerializer(
            project,
            context={"request": request},
        )

        return Response(
            output.data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------
# PROJECT DETAILS
# ---------------------------------------------------------

class ProjectDetail(generics.RetrieveAPIView):

    queryset = (
        Project.objects
        .select_related(
            "course__department__school",
            "leader",
        )
        .prefetch_related(
            "technologies",
            "members",
            "supervisors",
            "attachments",
        )
    )

    serializer_class = ProjectSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_context(self):

        return {
            **super().get_serializer_context(),
            "request": self.request,
        }

    def get_queryset(self):

        queryset = super().get_queryset()
        user = self.request.user

        if (
            user.is_authenticated
            and user.role == User.SUPERVISOR
        ):

            queryset = queryset.filter(
                supervisors=user
            )

        return queryset


# ---------------------------------------------------------
# COMMENTS AND REVIEW
# ---------------------------------------------------------

def _team(project):

    people = {
        project.leader.pk: project.leader
    }

    for member in project.members.all():
        people[member.pk] = member

    return list(people.values())


def _can_access(user, project):

    return (
        user.is_staff
        or user.role == User.ADMIN
        or project.leader_id == user.pk
        or project.members.filter(pk=user.pk).exists()
        or project.supervisors.filter(pk=user.pk).exists()
    )


class ProjectComments(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):

        project = get_object_or_404(Project, pk=pk)

        if not _can_access(request.user, project):

            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        comments = project.comments.select_related("author")

        return Response(
            CommentSerializer(comments, many=True).data
        )

    def post(self, request, pk):

        project = get_object_or_404(Project, pk=pk)
        user = request.user

        if not _can_access(user, project):

            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        text = str(
            request.data.get("text", "")
        ).strip()

        if not text:

            return Response(
                {"text": "Write a comment first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = Comment.objects.create(
            project=project,
            author=user,
            text=text,
        )

        if user.role == User.SUPERVISOR:

            recipients = _team(project)

            message = (
                f'Supervisor {user.full_name} commented on '
                f'"{project.title}": {text[:120]}'
            )

        else:

            recipients = list(
                project.supervisors.exclude(pk=user.pk)
            )

            message = (
                f'{user.full_name} replied on '
                f'"{project.title}": {text[:120]}'
            )

        for person in recipients:

            if person.pk != user.pk:

                Notification.objects.create(
                    recipient=person,
                    project=project,
                    message=message[:300],
                )

        return Response(
            CommentSerializer(comment).data,
            status=status.HTTP_201_CREATED,
        )


class ProjectReview(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):

        project = get_object_or_404(Project, pk=pk)
        user = request.user

        is_supervisor = project.supervisors.filter(
            pk=user.pk
        ).exists()

        is_admin = (
            user.is_staff
            or user.role == User.ADMIN
        )

        if not (is_supervisor or is_admin):

            return Response(
                {
                    "detail": (
                        "Only a supervisor of this project "
                        "can review it."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        new_status = request.data.get("status")

        if new_status not in (
            Project.APPROVED,
            Project.REJECTED,
        ):

            return Response(
                {
                    "status": (
                        "Use 'approved' or 'rejected'."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        project.status = new_status

        project.save(
            update_fields=["status"]
        )

        note = str(
            request.data.get("comment", "")
        ).strip()

        if note:

            Comment.objects.create(
                project=project,
                author=user,
                text=note,
            )

        message = (
            f'Your project "{project.title}" was '
            f'{new_status} by {user.full_name}.'
        )

        if note:
            message += f" Comment: {note[:120]}"

        for person in _team(project):

            Notification.objects.create(
                recipient=person,
                project=project,
                message=message[:300],
            )

        return Response({
            "ok": True,
            "status": new_status,
        })


# ---------------------------------------------------------
# NOTIFICATIONS
# ---------------------------------------------------------

class NotificationList(
    NoPagination,
    generics.ListAPIView
):

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        return (
            Notification.objects
            .filter(recipient=self.request.user)
            .select_related("project")
        )


class NotificationRead(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk=None):

        queryset = Notification.objects.filter(
            recipient=request.user
        )

        if pk:
            queryset = queryset.filter(pk=pk)

        queryset.update(is_read=True)

        return Response({"ok": True})


# ---------------------------------------------------------
# SYSTEM STATISTICS
# ---------------------------------------------------------

class StatsView(APIView):

    permission_classes = [permissions.AllowAny]

    def get(self, request):

        return Response({
            "projects": Project.objects.count(),

            "students": User.objects.filter(
                role=User.STUDENT
            ).count(),

            "supervisors": User.objects.filter(
                role=User.SUPERVISOR
            ).count(),

            "technologies": Technology.objects.count(),
        })
