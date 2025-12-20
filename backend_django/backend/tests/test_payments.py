from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model

from backend.models import Service, Slot, Booking, Payment

User = get_user_model()


class PaymentTests(APITestCase):

    def setUp(self):
        self.customer = User.objects.create_user(
            email="cust@test.com",
            password="StrongPassword!123",
            role="customer",
            is_verified=True,
        )
        self.organiser = User.objects.create_user(
            email="org@test.com",
            password="StrongPassword!123",
            role="organiser",
            is_verified=True,
        )

        self.service = Service.objects.create(
            organiser=self.organiser,
            name="Paid Service",
            duration_minutes=30,
            price="1000.00",
            advance_payment_required=True,
        )

        start = timezone.now() + timedelta(days=1)
        self.slot = Slot.objects.create(
            service=self.service,
            start_datetime=start,
            end_datetime=start + timedelta(minutes=30),
            capacity=5,
            booked_count=0,
        )

        self.booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            slot=self.slot,
            status="pending",
        )

        self.client.force_authenticate(user=self.customer)

    @patch("backend.views.get_razorpay_client")
    def test_create_payment_order(self, mock_client_factory):
        mock_client = MagicMock()
        mock_client.order.create.return_value = {"id": "order_12345"}
        mock_client_factory.return_value = mock_client

        response = self.client.post(
            "/api/payments/create-order/",
            {"booking_id": self.booking.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_id"], "order_12345")

        payment = Payment.objects.get(booking=self.booking)
        self.assertEqual(payment.status, "initiated")

    @patch("backend.views.get_razorpay_client")
    def test_verify_payment_success(self, mock_client_factory):
        payment = Payment.objects.create(
            booking=self.booking,
            amount=1000,
            razorpay_order_id="order_12345",
            status="initiated",
        )

        mock_client = MagicMock()
        mock_client.utility.verify_payment_signature.return_value = None
        mock_client_factory.return_value = mock_client

        with patch("backend.views.run_task"):
            response = self.client.post(
                "/api/payments/verify/",
                {
                    "order_id": "order_12345",
                    "payment_id": "pay_98765",
                    "signature": "valid_signature",
                },
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        payment.refresh_from_db()
        self.booking.refresh_from_db()

        self.assertEqual(payment.status, "paid")
        self.assertEqual(self.booking.status, "confirmed")
