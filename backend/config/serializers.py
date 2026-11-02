
from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework import serializers

from .models import (
    Course,
    Department,
    Notification,
    Project,
    ProjectAttachment,
    School,
    Technology,
    User,
    Comment,
)


# ---------------------------------------------------------
# LOOKUP SERIALIZERS
# ---------------------------------------------------------

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ["id", "name", "code"]


class DepartmentSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(
        source="school.name",
        read_only=True
    )

    class Meta:
        model = Department
        fields = ["id", "name", "school", "school_name"]


class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    class Meta:
        model = Course
        fields = ["id", "name", "department", "department_name"]


class TechnologySerializer(serializers.ModelSerializer):
    class Meta:
        model = Technology
        fields = ["id", "name"]


# ---------------------------------------------------------
# USER SERIALIZERS
# ---------------------------------------------------------

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
        default=""
    )

    course_name = serializers.CharField(
        source="course.name",
        read_only=True,
        default=""
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "full_name",
            "first_name",
            "last_name",
            "email",
            "role",
            "reg_number",
            "phone",
            "department",
            "department_name",
            "course",
            "course_name",
        ]


class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "full_name", "reg_number", "email"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "email",
            "reg_number",
            "phone",
            "department",
            "course",
            "password",
        ]

        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "reg_number": {"required": True},
            "email": {"required": True},
        }

    def validate_reg_number(self, value):
        value = value.strip().upper()

        if User.objects.filter(reg_number=value).exists():
            raise serializers.ValidationError(
                "This registration number is already registered."
            )

        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(
            username=validated_data["reg_number"],
            role=User.STUDENT,
            **validated_data
        )

        user.set_password(password)
        user.save()

        return user


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        ident = attrs["identifier"].strip()

        user_obj = (
            User.objects.filter(reg_number__iexact=ident).first()
            or User.objects.filter(username__iexact=ident).first()
            or User.objects.filter(email__iexact=ident).first()
        )

        if not user_obj:
            raise serializers.ValidationError(
                "Invalid credentials."
            )

        user = authenticate(
            username=user_obj.username,
            password=attrs["password"]
        )

        if not user:
            raise serializers.ValidationError(
                "Invalid credentials."
            )

        attrs["user"] = user
        return attrs


class SupervisorCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "department",
            "password",
        ]

        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "email": {"required": True},
            "department": {
                "required": True,
                "allow_null": False
            },
        }

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(
            username=validated_data["email"],
            role=User.SUPERVISOR,
            **validated_data
        )

        user.set_password(password)
        user.save()

        return user


# ---------------------------------------------------------
# PROJECT ATTACHMENT SERIALIZER
# ---------------------------------------------------------

class ProjectAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectAttachment
        fields = [
            "id",
            "file",
            "file_url",
            "uploaded_at",
        ]

    def get_file_url(self, obj):
        if not obj.file:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.file.url)

        return obj.file.url


# ---------------------------------------------------------
# PROJECT READ SERIALIZER
# ---------------------------------------------------------

class ProjectSerializer(serializers.ModelSerializer):
    leader = UserBriefSerializer(read_only=True)
    members = UserBriefSerializer(many=True, read_only=True)
    supervisors = UserBriefSerializer(many=True, read_only=True)

    technologies = TechnologySerializer(
        many=True,
        read_only=True
    )

    course_name = serializers.CharField(
        source="course.name",
        read_only=True
    )

    department_name = serializers.CharField(
        source="course.department.name",
        read_only=True
    )

    school_name = serializers.CharField(
        source="course.department.school.name",
        read_only=True
    )

    cover_url = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()

    attachments = ProjectAttachmentSerializer(
        many=True,
        read_only=True
    )

    status = serializers.CharField(read_only=True)

    class Meta:
        model = Project

        fields = [
            "id",
            "title",
            "description",
            "year",
            "status",
            "course",
            "course_name",
            "department_name",
            "school_name",
            "technologies",
            "submission_type",
            "leader",
            "members",
            "supervisors",
            "repo_url",
            "demo_url",
            "cover_url",
            "document_url",
            "attachments",
            "created_at",
        ]

    def get_cover_url(self, obj):
        if not obj.cover:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.cover.url)

        return obj.cover.url

    def get_document_url(self, obj):
        if not obj.document:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(obj.document.url)

        return obj.document.url


# ---------------------------------------------------------
# PROJECT CREATE SERIALIZER
# ---------------------------------------------------------

class ProjectCreateSerializer(serializers.ModelSerializer):

    technologies = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Technology.objects.all()
    )

    members = serializers.PrimaryKeyRelatedField(
        many=True,
        required=False,
        queryset=User.objects.filter(role=User.STUDENT)
    )

    supervisors = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(role=User.SUPERVISOR)
    )

    # Main project document
    document = serializers.FileField(
        required=False,
        allow_null=True
    )

    # Multiple additional files
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = Project

        fields = [
            "title",
            "description",
            "year",
            "course",
            "technologies",
            "submission_type",
            "members",
            "supervisors",
            "repo_url",
            "demo_url",
            "cover",
            "document",
            "attachments",
        ]

    def validate_supervisors(self, value):
        if len({s.pk for s in value}) != 2:
            raise serializers.ValidationError(
                "Choose exactly two different supervisors."
            )

        return value

    def validate_technologies(self, value):
        if not value:
            raise serializers.ValidationError(
                "Choose at least one technology."
            )

        return value

    def validate(self, attrs):
        leader = self.context["request"].user

        if leader.role != User.STUDENT:
            raise serializers.ValidationError(
                "Only students can submit projects."
            )

        members = attrs.get("members", [])

        if attrs.get("submission_type") == Project.GROUP:
            others = [
                member for member in members
                if member.pk != leader.pk
            ]

            if not others:
                raise serializers.ValidationError({
                    "members": (
                        "A group submission needs at least "
                        "one other registered member."
                    )
                })

        else:
            attrs["members"] = []

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        technologies = validated_data.pop("technologies")
        members = validated_data.pop("members", [])
        supervisors = validated_data.pop("supervisors")

        attachments = validated_data.pop("attachments", [])

        leader = self.context["request"].user

        project = Project.objects.create(
            leader=leader,
            **validated_data
        )

        project.technologies.set(technologies)
        project.supervisors.set(supervisors)

        # Group leader is also a group member
        if project.submission_type == Project.GROUP:
            team = {
                leader.pk: leader,
                **{member.pk: member for member in members}
            }

            project.members.set(team.values())

        # Save additional files
        for uploaded_file in attachments:
            ProjectAttachment.objects.create(
                project=project,
                file=uploaded_file
            )

        # Notify both supervisors
        submitter = (
            f"Group led by {leader.full_name}"
            if project.submission_type == Project.GROUP
            else leader.full_name
        )

        for supervisor in supervisors:
            Notification.objects.create(
                recipient=supervisor,
                project=project,
                message=(
                    f'{submitter} submitted the project '
                    f'"{project.title}" under your supervision.'
                )
            )

        return project


# ---------------------------------------------------------
# NOTIFICATION SERIALIZER
# ---------------------------------------------------------

class NotificationSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(
        source="project.title",
        read_only=True
    )

    class Meta:
        model = Notification

        fields = [
            "id",
            "project",
            "project_title",
            "message",
            "is_read",
            "created_at",
        ]


# ---------------------------------------------------------
# PROFILE SERIALIZERS
# ---------------------------------------------------------

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
        ]

        extra_kwargs = {
            "first_name": {"required": True},
            "last_name": {"required": True},
            "email": {"required": True},
        }

    def validate_email(self, value):
        taken = (
            User.objects.filter(email__iexact=value)
            .exclude(pk=self.instance.pk)
        )

        if taken.exists():
            raise serializers.ValidationError(
                "This email is already used by another account."
            )

        return value


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)

    new_password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError(
                "Your current password is incorrect."
            )

        return value

class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(
        source="author.full_name", read_only=True
    )
    author_role = serializers.CharField(
        source="author.role", read_only=True
    )

    class Meta:
        model = Comment
        fields = [
            "id",
            "author",
            "author_name",
            "author_role",
            "text",
            "created_at",
        ]
        read_only_fields = ["author"]