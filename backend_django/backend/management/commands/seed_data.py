import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model

from backend.models import (
    Service,
    Resource,
    WorkingHours,
    Slot,
    Booking,
    Payment,
    Notification,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding demo data...")

        # CLEAN EXISTING DATA
        Notification.objects.all().delete()
        Payment.objects.all().delete()
        Booking.objects.all().delete()
        Slot.objects.all().delete()
        WorkingHours.objects.all().delete()
        Resource.objects.all().delete()
        Service.objects.all().delete()

        # USERS
        admin, _ = User.objects.get_or_create(
            email="admin@demo.in",
            defaults={
                "full_name": "Admin User",
                "role": "admin",
                "phone_no": "9999999999",
                "notification_preference": "email",
                "notification_consent": True,
                "is_verified": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin.set_password("admin123")
        admin.save()

        organiser, _ = User.objects.get_or_create(
            email="organiser@demo.in",
            defaults={
                "full_name": "Clinic Organiser",
                "role": "organiser",
                "phone_no": "8888888888",
                "notification_preference": "email",
                "notification_consent": True,
                "is_verified": True,
            },
        )
        organiser.set_password("organiser123")
        organiser.save()

        customers = []
        for i in range(1, 4):
            user, _ = User.objects.get_or_create(
                email=f"customer{i}@demo.in",
                defaults={
                    "full_name": f"Customer {i}",
                    "role": "customer",
                    "phone_no": f"777777777{i}",
                    "notification_preference": "email",
                    "notification_consent": True,
                    "is_verified": True,
                },
            )
            user.set_password("customer123")
            user.save()
            customers.append(user)

        # SERVICE
        service = Service.objects.create(
            organiser=organiser,
            name="Doctor Consultation",
            description="15-minute general consultation",
            duration_minutes=15,
            buffer_minutes=0,
            capacity_per_slot=1,
            advance_payment_required=True,
            price=500,
            manual_confirmation=False,
            auto_assign_resource=True,
            questions_schema=[
                {"key": "problem", "label": "Describe your problem"},
                {"key": "age", "label": "Age"},
            ],
            is_published=True,
        )

        # RESOURCE
        doctor = Resource.objects.create(
            service=service,
            name="Dr. Amit Sharma",
            type="user",
            linked_user=organiser,
            is_active=True,
        )

        # WORKING HOURS (Mon–Fri)
        for day in range(0, 5):
            WorkingHours.objects.create(
                service=service,
                resource=doctor,
                day_of_week=day,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(17, 0),
            )

        # SLOTS (next 3 days)
        now = timezone.localtime()

        slots = []
        for day_offset in range(1, 4):
            date = now.date() + datetime.timedelta(days=day_offset)
            day_start = timezone.make_aware(
                datetime.datetime.combine(date, datetime.time(9, 0))
            )

            for i in range(8):
                slot = Slot.objects.create(
                    service=service,
                    resource=doctor,
                    start_datetime=day_start + datetime.timedelta(minutes=i * 30),
                    end_datetime=day_start + datetime.timedelta(minutes=i * 30 + 15),
                    capacity=1,
                    booked_count=0,
                    is_active=True,
                )
                slots.append(slot)

        # BOOKINGS + PAYMENTS + NOTIFICATIONS
        for i, customer in enumerate(customers):
            slot = slots[i]

            booking = Booking.objects.create(
                customer=customer,
                slot=slot,
                service=service,
                resource=doctor,
                status="confirmed",
                answers={
                    "problem": "General checkup",
                    "age": 25 + i,
                },
            )

            slot.booked_count += 1
            slot.save(update_fields=["booked_count"])

            Payment.objects.create(
                booking=booking,
                amount=service.price,
                currency="INR",
                status="paid",
                provider="razorpay",
                razorpay_payment_id=f"rzp_demo_{i}",
            )

            Notification.objects.create(
                user=customer,
                channel=customer.notification_preference,
                title="Appointment Confirmed",
                message=f"Your appointment with {doctor.name} is confirmed.",
                is_sent=True,
            )

        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully"))
