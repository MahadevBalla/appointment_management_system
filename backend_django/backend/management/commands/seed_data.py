import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

from backend.models import (
    Service,
    Resource,
    WorkingHours,
    Slot,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seed services with multiple resources per service (schema-correct)"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data (services + resources + slots)...")

        # --------------------
        # CLEAN EXISTING DATA
        # --------------------
        Slot.objects.all().delete()
        WorkingHours.objects.all().delete()
        Resource.objects.all().delete()
        Service.objects.all().delete()

        # --------------------
        # USERS (organiser required)
        # --------------------
        organiser, _ = User.objects.get_or_create(
            email="organiser@demo.in",
            defaults={
                "full_name": "Demo Organiser",
                "role": "organiser",
                "phone_no": "8888888888",
                "notification_preference": "email",
                "notification_consent": True,
                "is_verified": True,
            },
        )
        organiser.set_password("organiser123")
        organiser.save()

        now = timezone.localtime()
        base_date = now.date() + datetime.timedelta(days=1)

        # --------------------
        # SERVICE DEFINITIONS
        # --------------------
        SERVICES = [
            {
                "name": "Doctor Consultation",
                "description": "15-minute medical consultation",
                "resources": [
                    ("Doctor One", "user"),
                    ("Doctor Two", "user"),
                    ("Doctor Three", "user"),
                ],
                "duration": 15,
                "price": 500,
            },
            {
                "name": "Tennis Court Booking",
                "description": "Book a tennis court",
                "resources": [
                    ("Court 1", "asset"),
                    ("Court 2", "asset"),
                    ("Court 3", "asset"),
                    ("Court 4", "asset"),
                ],
                "duration": 60,
                "price": 800,
            },
            {
                "name": "Salon Appointment",
                "description": "Hair & grooming service",
                "resources": [
                    ("Stylist A", "user"),
                    ("Stylist B", "user"),
                    ("Stylist C", "user"),
                ],
                "duration": 30,
                "price": 600,
            },
            {
                "name": "Physiotherapy Session",
                "description": "30-minute physiotherapy session",
                "resources": [
                    ("Physio Room 1", "asset"),
                    ("Physio Room 2", "asset"),
                ],
                "duration": 30,
                "price": 700,
            },
            {
                "name": "Yoga Class (Private)",
                "description": "One-on-one yoga session",
                "resources": [
                    ("Yoga Instructor 1", "user"),
                    ("Yoga Instructor 2", "user"),
                ],
                "duration": 45,
                "price": 900,
            },
            {
                "name": "Swimming Pool Slot",
                "description": "Timed swimming pool access",
                "resources": [
                    ("Lane 1", "asset"),
                    ("Lane 2", "asset"),
                    ("Lane 3", "asset"),
                    ("Lane 4", "asset"),
                ],
                "duration": 60,
                "price": 400,
            },
        ]

        # --------------------
        # CREATE DATA
        # --------------------
        for service_data in SERVICES:
            service = Service.objects.create(
                organiser=organiser,
                name=service_data["name"],
                description=service_data["description"],
                duration_minutes=service_data["duration"],
                buffer_minutes=0,
                capacity_per_slot=1,
                advance_payment_required=True,
                price=service_data["price"],
                manual_confirmation=False,
                auto_assign_resource=False,  # customer selects resource
                questions_schema=[
                    {
                        "key": "notes",
                        "label": "Additional notes",
                        "type": "text",
                        "required": False,
                    }
                ],
                is_published=True,
            )

            for resource_name, resource_type in service_data["resources"]:
                resource = Resource.objects.create(
                    service=service,
                    name=resource_name,
                    type=resource_type,
                    is_active=True,
                )

                # WORKING HOURS (Mon–Fri, 9 AM – 5 PM)
                for day in range(0, 5):
                    WorkingHours.objects.create(
                        service=service,
                        resource=resource,
                        day_of_week=day,
                        start_time=datetime.time(9, 0),
                        end_time=datetime.time(17, 0),
                    )

                # SLOTS (next 3 days, 5 slots per day per resource)
                for day_offset in range(1, 4):
                    date = base_date + datetime.timedelta(days=day_offset)
                    start_dt = timezone.make_aware(
                        datetime.datetime.combine(date, datetime.time(9, 0))
                    )

                    for i in range(5):
                        Slot.objects.create(
                            service=service,
                            resource=resource,
                            start_datetime=start_dt
                            + datetime.timedelta(minutes=i * service.duration_minutes),
                            end_datetime=start_dt
                            + datetime.timedelta(
                                minutes=(i + 1) * service.duration_minutes
                            ),
                            capacity=service.capacity_per_slot,
                            booked_count=0,
                            is_active=True,
                        )

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded 6 services with multiple resources, working hours, and slots"
            )
        )
