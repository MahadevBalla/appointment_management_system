from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch

from backend.models import OTP

User = get_user_model()


class AuthenticationTests(APITestCase):

    def test_signup_and_verification(self):
        register_url = "/api/auth/register/"
        verify_url = "/api/auth/verify-otp/"

        payload = {
            "email": "newuser@test.com",
            "password": "StrongPassword!123",
            "confirm_password": "StrongPassword!123",
            "full_name": "New User",
            "phone_no": "1234567890",
        }

        with patch("backend.views.send_otp") as mock_send_otp:
            response = self.client.post(register_url, payload)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
            mock_send_otp.assert_called_once()

        user = User.objects.get(email="newuser@test.com")
        self.assertFalse(user.is_verified)

        OTP.objects.create(
            user=user,
            code="123456",
            purpose="signup",
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        response = self.client.post(
            verify_url,
            {
                "email": "newuser@test.com",
                "otp": "123456",
                "purpose": "signup",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.is_verified)

    def test_login_verified_user(self):
        User.objects.create_user(
            email="login@test.com",
            password="StrongPassword!123",
            is_verified=True,
        )

        response = self.client.post(
            "/api/auth/login/",
            {"email": "login@test.com", "password": "StrongPassword!123"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_unverified_user_fails(self):
        User.objects.create_user(
            email="unverified@test.com",
            password="StrongPassword!123",
            is_verified=False,
        )

        response = self.client.post(
            "/api/auth/login/",
            {"email": "unverified@test.com", "password": "StrongPassword!123"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
