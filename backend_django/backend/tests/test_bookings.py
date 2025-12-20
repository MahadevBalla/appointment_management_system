from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model

from backend.models import Service, Resource, Slot, Booking

User = get_user_model()


class BookingTests(APITestCase):

    def setUp(self):
        self.organiser = User.objects.create_user(
            email="org@test.com",
            password="StrongPassword!123",
            role="organiser",
            is_verified=True,
        )
        self.customer = User.objects.create_user(
            email="cust@test.com",
            password="StrongPassword!123",
            role="customer",
            is_verified=True,
        )

        self.service = Service.objects.create(
            organiser=self.organiser,
            name="Test Service",
            duration_minutes=60,
            price="100.00",
            is_published=True,
        )

        self.resource = Resource.objects.create(
            service=self.service,
            name="Dr. Smith",
            type="user",
        )

        start = timezone.now() + timedelta(days=1)
        self.slot = Slot.objects.create(
            service=self.service,
            resource=self.resource,
            start_datetime=start,
            end_datetime=start + timedelta(minutes=60),
            capacity=1,
            booked_count=0,
            is_active=True,
        )

    def test_create_booking_success(self):
        self.client.force_authenticate(user=self.customer)

        with patch("backend.views.run_task"):
            response = self.client.post(
                "/api/bookings/",
                {
                    "service": self.service.id,
                    "resource": self.resource.id,
                    "slot": self.slot.id,
                    "quantity": 1,
                },
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.slot.refresh_from_db()
        self.assertEqual(self.slot.booked_count, 1)

    def test_create_booking_capacity_full(self):
        self.slot.booked_count = 1
        self.slot.save()

        self.client.force_authenticate(user=self.customer)

        response = self.client.post(
            "/api/bookings/",
            {
                "service": self.service.id,
                "resource": self.resource.id,
                "slot": self.slot.id,
                "quantity": 1,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_booking(self):
        booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            resource=self.resource,
            slot=self.slot,
            status="confirmed",
            quantity=1,
        )
        self.slot.booked_count = 1
        self.slot.save()

        self.client.force_authenticate(user=self.customer)

        with patch("backend.serializers.run_task"):
            response = self.client.patch(f"/api/bookings/{booking.id}/cancel/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        booking.refresh_from_db()
        self.slot.refresh_from_db()

        self.assertEqual(booking.status, "cancelled")
        self.assertEqual(self.slot.booked_count, 0)
