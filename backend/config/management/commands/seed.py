"""
Jaza database na sample data.

    python manage.py seed

Hii ni SAMPLE data tu. Schools, departments na courses halisi za ARU
zihariri kwenye Django admin: http://127.0.0.1:8000/admin/
"""
from django.core.management.base import BaseCommand

from config.models import (
    Course,
    Department,
    Notification,
    Project,
    School,
    Technology,
    User,
)

# School -> Department -> list ya Courses
STRUCTURE = {
    "School of Earth Sciences, Real Estate, Business and Informatics (SERBI)": {
        "Department of Computer Systems and Mathematics": [
            "BSc in Computer Science",
            "BSc in Computer Systems and Networks",
            "BSc in Information Systems and Technology",
        ],
        "Department of Geospatial Sciences and Technology": [
            "BSc in Geoinformatics",
            "BSc in Geomatics",
        ],
        "Department of Business Studies": ["BSc in Business Administration"],
    },
    "School of Architecture, Construction Economics and Management (SACEM)": {
        "Department of Architecture": ["Bachelor of Architecture"],
        "Department of Construction Economics": ["BSc in Quantity Surveying"],
    },
    "School of Spatial Planning and Social Sciences (SSPSS)": {
        "Department of Urban and Regional Planning": ["BSc in Urban and Regional Planning"],
        "Department of Social Sciences": ["BSc in Sociology and Development"],
    },
}

TECHNOLOGIES = [
    "Python", "Django", "Django REST", "React", "JavaScript", "TypeScript", "Node.js",
    "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Flutter", "Kotlin", "Java", "PHP",
    "Laravel", "Arduino", "ESP32", "Raspberry Pi", "MQTT", "IoT", "Machine Learning",
    "TensorFlow", "QGIS", "ArcGIS", "Leaflet", "Docker", "Tailwind CSS",
]

SUPERVISORS = [
    ("Godfrey", "Luwemba", "g.luwemba@aru.ac.tz"),
    ("Alexander", "Moreka", "a.moreka@aru.ac.tz"),
    ("Neema", "Mushi", "n.mushi@aru.ac.tz"),
]

STUDENTS = [
    ("Danny", "Student", "ARU/2022/0001"),
    ("Amina", "Juma", "ARU/2022/0002"),
    ("Baraka", "Msuya", "ARU/2022/0003"),
    ("Neema", "Kileo", "ARU/2023/0004"),
]


class Command(BaseCommand):
    help = "Seed sample schools, departments, courses, technologies, users and projects."

    def handle(self, *args, **options):
        # --- schools, departments, courses ---
        main_dept = None
        main_course = None
        for school_name, depts in STRUCTURE.items():
            code = school_name.split("(")[-1].rstrip(")")
            school, _ = School.objects.get_or_create(name=school_name, defaults={"code": code})
            for dept_name, courses in depts.items():
                dept, _ = Department.objects.get_or_create(school=school, name=dept_name)
                for c in courses:
                    course, _ = Course.objects.get_or_create(department=dept, name=c)
                    if c == "BSc in Computer Systems and Networks":
                        main_dept, main_course = dept, course

        # --- technologies ---
        for name in TECHNOLOGIES:
            Technology.objects.get_or_create(name=name)

        # --- admin ---
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                "admin", "admin@aru.ac.tz", "admin12345",
                role=User.ADMIN, first_name="SPR", last_name="Admin",
            )

        # --- supervisors ---
        sups = []
        for first, last, email in SUPERVISORS:
            u, created = User.objects.get_or_create(
                username=email,
                defaults=dict(
                    first_name=first, last_name=last, email=email,
                    role=User.SUPERVISOR, department=main_dept,
                ),
            )
            if created:
                u.set_password("supervisor123")
                u.save()
            sups.append(u)

        # --- students ---
        studs = []
        for first, last, reg in STUDENTS:
            u, created = User.objects.get_or_create(
                username=reg,
                defaults=dict(
                    first_name=first, last_name=last, reg_number=reg,
                    email=f"{first.lower()}@students.aru.ac.tz",
                    role=User.STUDENT, department=main_dept, course=main_course,
                ),
            )
            if created:
                u.set_password("student123")
                u.save()
            studs.append(u)

        # --- demo projects (tu kama hakuna project yoyote) ---
        if not Project.objects.exists():
            tech = {t.name: t for t in Technology.objects.all()}
            demos = [
                (
                    "Smart Public Toilet Occupancy Display and Usage Analytics System",
                    "An IoT system that detects toilet occupancy with sensors, shows live "
                    "status on a display and gives managers usage analytics on a web dashboard.",
                    2026, ["ESP32", "MQTT", "Django", "React", "PostgreSQL"], studs[0], [],
                ),
                (
                    "ARU Portal Mobile App",
                    "A mobile app that lets Ardhi University students and teachers access "
                    "results, timetables and announcements from one place.",
                    2025, ["Flutter", "Django REST", "PostgreSQL"], studs[1], [studs[2]],
                ),
                (
                    "Land Parcel Mapping Web Tool",
                    "A web GIS tool for visualising and searching land parcels on an "
                    "interactive map.",
                    2025, ["Leaflet", "QGIS", "JavaScript"], studs[3], [],
                ),
            ]
            for title, desc, year, techs, leader, others in demos:
                p = Project.objects.create(
                    title=title, description=desc, year=year, course=main_course,
                    submission_type=Project.GROUP if others else Project.INDIVIDUAL,
                    leader=leader,
                )
                p.technologies.set([tech[t] for t in techs if t in tech])
                p.supervisors.set(sups[:2])
                if others:
                    p.members.set([leader, *others])
                for s in sups[:2]:
                    Notification.objects.create(
                        recipient=s, project=p,
                        message=f'{leader.full_name} submitted the project "{title}" under your supervision.',
                    )

        self.stdout.write(self.style.SUCCESS("Sample data ready."))
        self.stdout.write("Admin      : admin / admin12345")
        self.stdout.write("Supervisor : g.luwemba@aru.ac.tz / supervisor123")
        self.stdout.write("Student    : ARU/2022/0001 / student123")