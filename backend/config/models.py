
from django.contrib.auth.models import AbstractUser
from django.db import models


class School(models.Model):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Department(models.Model):
    school = models.ForeignKey(
        School,
        on_delete=models.CASCADE,
        related_name="departments"
    )
    name = models.CharField(max_length=200)

    class Meta:
        ordering = ["name"]
        unique_together = ("school", "name")

    def __str__(self):
        return self.name


class Course(models.Model):
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="courses"
    )
    name = models.CharField(max_length=200)

    class Meta:
        ordering = ["name"]
        unique_together = ("department", "name")

    def __str__(self):
        return self.name


class Technology(models.Model):
    name = models.CharField(max_length=80, unique=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "technologies"

    def __str__(self):
        return self.name


class User(AbstractUser):
    STUDENT = "student"
    SUPERVISOR = "supervisor"
    ADMIN = "admin"

    ROLE_CHOICES = [
        (STUDENT, "Student"),
        (SUPERVISOR, "Supervisor"),
        (ADMIN, "Admin"),
    ]

    role = models.CharField(
        max_length=12,
        choices=ROLE_CHOICES,
        default=STUDENT
    )

    reg_number = models.CharField(
        "Registration number",
        max_length=40,
        unique=True,
        null=True,
        blank=True
    )

    phone = models.CharField(max_length=30, blank=True)

    department = models.ForeignKey(
        Department,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="people"
    )

    course = models.ForeignKey(
        Course,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="students"
    )

    @property
    def full_name(self):
        return self.get_full_name() or self.username

    def __str__(self):
        label = self.reg_number or self.username
        return f"{self.full_name} ({label})"


class Project(models.Model):
    INDIVIDUAL = "individual"
    GROUP = "group"

    TYPE_CHOICES = [
        (INDIVIDUAL, "Individual"),
        (GROUP, "Group"),
    ]

    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]

    status = models.CharField(
        max_length=12,
        choices=STATUS_CHOICES,
        default=PENDING
    )

    title = models.CharField(max_length=250)
    description = models.TextField()
    year = models.PositiveIntegerField()

    course = models.ForeignKey(
        Course,
        on_delete=models.PROTECT,
        related_name="projects"
    )

    technologies = models.ManyToManyField(
        Technology,
        related_name="projects"
    )

    submission_type = models.CharField(
        max_length=12,
        choices=TYPE_CHOICES,
        default=INDIVIDUAL
    )

    leader = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="led_projects"
    )

    members = models.ManyToManyField(
        User,
        blank=True,
        related_name="member_projects"
    )

    supervisors = models.ManyToManyField(
        User,
        related_name="supervised_projects"
    )

    repo_url = models.URLField(blank=True)
    demo_url = models.URLField(blank=True)

    # Project cover image
    cover = models.ImageField(
        upload_to="covers/",
        null=True,
        blank=True
    )

    # Main project document: PDF, DOC, DOCX
    document = models.FileField(
        upload_to="project_documents/",
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class ProjectAttachment(models.Model):
    # Additional files: ZIP and supporting materials
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="attachments"
    )

    file = models.FileField(
        upload_to="project_attachments/"
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name


class Notification(models.Model):
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    message = models.CharField(max_length=300)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient} - {self.message[:40]}"

class Comment(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author} - {self.text[:40]}"
        
class LoginOTP(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="login_otps"
    )
    code_hash = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]