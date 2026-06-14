import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup();
from django.contrib.auth.hashers import make_password
import random
import datetime
from django.utils import timezone
from django.contrib.auth import get_user_model
from backend.models import Service, Resource, Slot, Booking, User

User = get_user_model()

print("Seeding database for stress testing...")

# 1. Create a service organizer
organizer, _ = User.objects.get_or_create(
    email="organizer@stress.test",
    defaults={"full_name": "Test Organizer", "role": "organiser", "is_verified": True}
)
organizer.set_password("password123")
organizer.save()

# 2. Create a test service
service, _ = Service.objects.get_or_create(
    name="High Volume Consultation",
    organiser=organizer,
    defaults={
        "description": "Load testing service",
        "duration_minutes": 30,
        "buffer_minutes": 5,
        "capacity_per_slot": 2,
        "price": 100.00,
        "is_published": True
    }
)

# 3. Create a resource
resource, _ = Resource.objects.get_or_create(
    service=service,
    name="Consultant Alpha",
    defaults={"type": "user", "is_active": True}
)

# 4. Generate 10,000 Slots spread over the next 90 days
start_date = timezone.now().date()
slots_to_create = []

print("Generating 10,000 slots...")
for day_offset in range(90):
    current_date = start_date + datetime.timedelta(days=day_offset)
    for hour in range(8, 20):  # 8 AM to 8 PM
        for minute in [0, 30]:
            start_dt = timezone.make_aware(
                datetime.datetime.combine(current_date, datetime.time(hour, minute))
            )
            slots_to_create.append(
                Slot(
                    service=service,
                    resource=resource,
                    start_datetime=start_dt,
                    end_datetime=start_dt + datetime.timedelta(minutes=30),
                    capacity=2,
                    booked_count=0,
                    is_active=True
                )
            )

# Bulk create for database efficiency
Slot.objects.bulk_create(slots_to_create, ignore_conflicts=True)
print(f"Total Slots in DB: {Slot.objects.count()}")

# 5. Create 1,000 customer users and bookings
hashed_password = make_password("password123")
print("Generating 1,000 bookings...")
customers = []
for i in range(1000):
    customers.append(
        User(
            email=f"customer_{i}@stress.test",
            full_name=f"Load Customer {i}",
            role="customer",
            is_verified=True,
            password=hashed_password
        )
    )
User.objects.bulk_create(customers, ignore_conflicts=True)

all_customers = list(User.objects.filter(email__endswith="@stress.test").exclude(role="organiser"))
all_slots = list(Slot.objects.filter(service=service)[:500])  # Distribute bookings on the first 500 slots

bookings_to_create = []
for i in range(1000):
    customer = random.choice(all_customers)
    slot = random.choice(all_slots)
    
    # Increment slot booked count
    if slot.booked_count < slot.capacity:
        slot.booked_count += 1
        bookings_to_create.append(
            Booking(
                customer=customer,
                service=service,
                resource=resource,
                slot=slot,
                status="confirmed",
                quantity=1
            )
        )

# Bulk update slot counts
Slot.objects.bulk_update(all_slots, ["booked_count"])
# Bulk create bookings
Booking.objects.bulk_create(bookings_to_create)

print("Database seeding completed successfully.")
