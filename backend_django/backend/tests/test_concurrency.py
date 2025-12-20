from django.test import TestCase
from django.db import transaction
from django.utils import timezone
import threading
import time
import random

from django.contrib.auth import get_user_model
from backend.models import Service, Resource, Slot, Booking

User = get_user_model()


class ConcurrencyTests(TestCase):

    def test_prevent_overbooking(self):
        organiser = User.objects.create_user(
            email="org@test.com",
            password="StrongPassword!123",
            role="organiser",
        )

        service = Service.objects.create(
            organiser=organiser,
            name="High Demand",
            duration_minutes=60,
            price=100,
        )

        resource = Resource.objects.create(
            service=service,
            name="Room 1",
            type="asset",
        )

        start = timezone.now() + timezone.timedelta(days=1)
        slot = Slot.objects.create(
            service=service,
            resource=resource,
            start_datetime=start,
            end_datetime=start + timezone.timedelta(minutes=60),
            capacity=5,
            booked_count=0,
        )

        def attempt():
            user = User.objects.create_user(
                email=f"user{random.random()}@test.com",
                password="pass",
            )
            with transaction.atomic():
                locked = Slot.objects.select_for_update().get(id=slot.id)
                if locked.booked_count < locked.capacity:
                    Booking.objects.create(
                        customer=user,
                        service=service,
                        resource=resource,
                        slot=locked,
                        status="confirmed",
                    )
                    locked.booked_count += 1
                    time.sleep(0.02)
                    locked.save()

        threads = [threading.Thread(target=attempt) for _ in range(15)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        slot.refresh_from_db()
        self.assertLessEqual(slot.booked_count, slot.capacity)
