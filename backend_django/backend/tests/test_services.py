from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

from backend.models import Service

User = get_user_model()


class ServiceTests(APITestCase):

    def setUp(self):
        self.organiser = User.objects.create_user(
            email="org@test.com",
            password="StrongPassword!123",
            role="organiser",
            is_verified=True,
        )
        self.client.force_authenticate(user=self.organiser)

    def test_create_service(self):
        response = self.client.post(
            "/api/services/",
            {
                "name": "Derma Checkup",
                "description": "General checkup",
                "duration_minutes": 30,
                "price": "500.00",
                "is_published": True,
                "advance_payment_required": True,
            },
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Service.objects.count(), 1)
        self.assertEqual(Service.objects.first().organiser, self.organiser)

    def test_add_question_to_service(self):
        service = Service.objects.create(
            organiser=self.organiser,
            name="Test Service",
            duration_minutes=30,
        )

        response = self.client.post(
            f"/api/services/{service.id}/questions/",
            {
                "key": "age",
                "label": "Age",
                "type": "number",
                "required": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        service.refresh_from_db()
        self.assertEqual(len(service.questions_schema), 1)
        self.assertEqual(service.questions_schema[0]["key"], "age")
