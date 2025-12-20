"""

How to Run Tests

Use the following command to run the tests: 
venv/bin/python manage.py test backend --settings=config.test_settings

"""

from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, date
from unittest.mock import patch, MagicMock
from .models import Service, Resource, Slot, Booking, OTP, Payment, Notification

User = get_user_model()

class AuthenticationTests(APITestCase):
    def test_signup_and_verification(self):
        """Test the full signup flow: Register -> Receive OTP (mock) -> Verify OTP"""
        register_url = "/api/auth/register/"
        verify_url = "/api/auth/verify-otp/"
        
        payload = {
            "email": "newuser@test.com",
            "password": "StrongPassword!123",
            "confirm_password": "StrongPassword!123",
            "full_name": "New User",
            "phone_no": "1234567890"
        }
        
        # 1. Register
        with patch('backend.views.send_otp') as mock_send_otp:
            response = self.client.post(register_url, payload)
            if response.status_code != status.HTTP_201_CREATED:
                print(f"Signup Failed: {response.data}")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            mock_send_otp.assert_called_once()
            
            # Verify user created but not verified
            user = User.objects.get(email="newuser@test.com")
            self.assertFalse(user.is_verified)
            
            # Create OTP manually since we mocked send_otp
            OTP.objects.create(
                user=user,
                code="123456",
                purpose="signup",
                expires_at=timezone.now() + timedelta(minutes=5)
            )
            
            # 2. Verify OTP
            verify_payload = {
                "email": "newuser@test.com",
                "otp": "123456",
                "purpose": "signup"
            }
            response = self.client.post(verify_url, verify_payload)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            user.refresh_from_db()
            self.assertTrue(user.is_verified)

    def test_login(self):
        """Test login with verified user"""
        user = User.objects.create_user(
            email="login@test.com", 
            password="StrongPassword!123", 
            is_verified=True
        )
        url = "/api/auth/login/"
        response = self.client.post(url, {"email": "login@test.com", "password": "StrongPassword!123"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_unverified(self):
        """Test login fails for unverified user"""
        User.objects.create_user(
            email="unverified@test.com", 
            password="StrongPassword!123", 
            is_verified=False
        )
        url = "/api/auth/login/"
        response = self.client.post(url, {"email": "unverified@test.com", "password": "StrongPassword!123"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ServiceTests(APITestCase):
    def setUp(self):
        self.organiser = User.objects.create_user(
            email="org@test.com", 
            password="StrongPassword!123", 
            role="organiser",
            is_verified=True
        )
        self.customer = User.objects.create_user(
            email="cust@test.com", 
            password="StrongPassword!123", 
            role="customer",
            is_verified=True
        )
        self.client.force_authenticate(user=self.organiser)

    def test_create_service(self):
        """Test organiser can create service"""
        url = "/api/services/"
        data = {
            "name": "Derma Checkup",
            "description": "General checkup",
            "duration_minutes": 30,
            "price": "500.00",
            "is_published": True,
            "advance_payment_required": True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Service.objects.count(), 1)
        self.assertEqual(Service.objects.first().organiser, self.organiser)

    def test_add_question_to_service(self):
        service = Service.objects.create(
            organiser=self.organiser, 
            name="Test Service", 
            duration_minutes=30
        )
        url = f"/api/services/{service.id}/questions/"
        data = {
            "key": "age",
            "label": "Age",
            "type": "number",
            "required": True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        service.refresh_from_db()
        self.assertEqual(len(service.questions_schema), 1)
        self.assertEqual(service.questions_schema[0]['key'], 'age')


class BookingTests(APITestCase):
    def setUp(self):
        self.organiser = User.objects.create_user(
            email="org@test.com", password="StrongPassword!123", role="organiser", is_verified=True
        )
        self.customer = User.objects.create_user(
            email="cust@test.com", password="StrongPassword!123", role="customer", is_verified=True
        )
        self.service = Service.objects.create(
            organiser=self.organiser,
            name="Test Service",
            duration_minutes=60,
            price="100.00",
            is_published=True
        )
        self.resource = Resource.objects.create(
            service=self.service,
            name="Dr. Smith",
            type="user"
        )
        
        # Create a Slot
        start = timezone.now() + timedelta(days=1)
        self.slot = Slot.objects.create(
            service=self.service,
            resource=self.resource,
            start_datetime=start,
            end_datetime=start + timedelta(minutes=60),
            capacity=1,
            booked_count=0,
            is_active=True
        )

    def test_create_booking_success(self):
        self.client.force_authenticate(user=self.customer)
        url = "/api/bookings/"
        data = {
            "service": self.service.id,
            "resource": self.resource.id,
            "slot": self.slot.id,
            "quantity": 1
        }
        
        # Mock task to avoid celery
        with patch('backend.views.run_task') as mock_task:
            response = self.client.post(url, data)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            self.slot.refresh_from_db()
            self.assertEqual(self.slot.booked_count, 1)
            self.assertEqual(Booking.objects.count(), 1)

    def test_create_booking_capacity_full(self):
        self.slot.booked_count = 1
        self.slot.capacity = 1
        self.slot.save()
        
        self.client.force_authenticate(user=self.customer)
        url = "/api/bookings/"
        data = {
            "service": self.service.id,
            "resource": self.resource.id,
            "slot": self.slot.id,
            "quantity": 1
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_booking(self):
        booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            resource=self.resource,
            slot=self.slot,
            status="confirmed",
            quantity=1
        )
        self.slot.booked_count = 1
        self.slot.save()

        self.client.force_authenticate(user=self.customer)
        url = f"/api/bookings/{booking.id}/cancel/"
        
        with patch('backend.serializers.run_task') as mock_task:
            response = self.client.patch(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            booking.refresh_from_db()
            self.slot.refresh_from_db()
            
            self.assertEqual(booking.status, "cancelled")
            self.assertEqual(self.slot.booked_count, 0)


class PaymentTests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            email="cust@test.com", password="StrongPassword!123", role="customer", is_verified=True
        )
        self.organiser = User.objects.create_user(
            email="org@test.com", password="StrongPassword!123", role="organiser", is_verified=True
        )
        self.service = Service.objects.create(
            organiser=self.organiser,
            name="Paid Service",
            duration_minutes=30,
            price="1000.00",
            advance_payment_required=True
        )
        start = timezone.now() + timedelta(days=1)
        self.slot = Slot.objects.create(
            service=self.service,
            start_datetime=start,
            end_datetime=start + timedelta(minutes=30),
            capacity=5,
            booked_count=0
        )
        self.booking = Booking.objects.create(
            customer=self.customer,
            service=self.service,
            slot=self.slot,
            status="pending"
        )
        self.client.force_authenticate(user=self.customer)

    @patch('backend.views.get_razorpay_client')
    def test_create_payment_order(self, mock_client_factory):
        # Mock Razorpay client
        mock_client = MagicMock()
        mock_client.order.create.return_value = {"id": "order_12345"}
        mock_client_factory.return_value = mock_client
        
        url = "/api/payments/create-order/"
        data = {"booking_id": self.booking.id}
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_id"], "order_12345")
        
        # Verify payment record created
        payment = Payment.objects.get(booking=self.booking)
        self.assertEqual(payment.razorpay_order_id, "order_12345")
        self.assertEqual(payment.status, "initiated")

    @patch('backend.views.get_razorpay_client')
    def test_verify_payment_success(self, mock_client_factory):
        # Setup existing payment
        payment = Payment.objects.create(
            booking=self.booking,
            amount=1000,
            razorpay_order_id="order_12345",
            status="initiated"
        )
        
        # Mock successful signature verification (returns None on success)
        mock_client = MagicMock()
        mock_client.utility.verify_payment_signature.return_value = None
        mock_client_factory.return_value = mock_client
        
        url = "/api/payments/verify/"
        data = {
            "order_id": "order_12345",
            "payment_id": "pay_98765",
            "signature": "valid_signature"
        }
        
        with patch('backend.views.run_task'):
            response = self.client.post(url, data)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            payment.refresh_from_db()
            self.booking.refresh_from_db()
            
            self.assertEqual(payment.status, "paid")
            self.assertEqual(self.booking.status, "confirmed")
