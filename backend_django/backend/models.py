import uuid
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.utils import timezone
from django.core.exceptions import ValidationError


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_verified", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("customer", "Customer"),
        ("organiser", "Organiser"),
        ("admin", "Admin"),
    ]

    NOTIFICATION_PREF_CHOICES = [
        ("email", "Email"),
        ("sms", "SMS"),
        ("whatsapp", "WhatsApp"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    email = models.EmailField(unique=True)
    phone_no = models.CharField(max_length=15, blank=True, null=True)

    full_name = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")

    notification_preference = models.CharField(
        max_length=20,
        choices=NOTIFICATION_PREF_CHOICES,
        default="email",
    )
    notification_consent = models.BooleanField(default=True)

    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"


class OTP(models.Model):
    PURPOSE_CHOICES = [
        ("signup", "Signup"),
        ("password_reset", "Password Reset"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)

    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at

    class Meta:
        indexes = [
            models.Index(fields=["user", "purpose"]),
        ]


class Service(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organiser = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="services"
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    duration_minutes = models.PositiveIntegerField()
    buffer_minutes = models.PositiveIntegerField(default=0)

    capacity_per_slot = models.PositiveIntegerField(default=1)
    advance_payment_required = models.BooleanField(default=False)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    manual_confirmation = models.BooleanField(default=False)
    auto_assign_resource = models.BooleanField(default=True)

    questions_schema = models.JSONField(default=list)

    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Resource(models.Model):
    TYPE_CHOICES = [
        ("user", "Staff/User"),
        ("asset", "Asset/Room"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="resources"
    )

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)

    linked_user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )

    is_active = models.BooleanField(default=True)


class WorkingHours(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    resource = models.ForeignKey(
        Resource, null=True, blank=True, on_delete=models.CASCADE
    )

    day_of_week = models.IntegerField(
        choices=[
            (0, "Mon"),
            (1, "Tue"),
            (2, "Wed"),
            (3, "Thu"),
            (4, "Fri"),
            (5, "Sat"),
            (6, "Sun"),
        ]
    )

    start_time = models.TimeField()
    end_time = models.TimeField()

    def clean(self):
        if self.resource and self.resource.service_id != self.service_id:
            raise ValidationError(
                "WorkingHours.resource must belong to the same service."
            )


class Slot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    resource = models.ForeignKey(
        Resource, null=True, blank=True, on_delete=models.CASCADE
    )

    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()

    capacity = models.PositiveIntegerField(default=1)
    booked_count = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("resource", "start_datetime")


class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    resource = models.ForeignKey(
        Resource, null=True, blank=True, on_delete=models.SET_NULL
    )
    slot = models.ForeignKey(Slot, on_delete=models.PROTECT)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )
    answers = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    quantity = models.PositiveIntegerField(default=1)

    def clean(self):
        if self.service_id != self.slot.service_id:
            raise ValidationError("Booking.service must match slot.service")

        if self.slot.resource and self.resource_id != self.slot.resource_id:
            raise ValidationError("Booking.resource must match slot.resource")

        if self.resource and self.resource.service_id != self.service_id:
            raise ValidationError("Resource does not belong to booking service")


class Payment(models.Model):
    STATUS_CHOICES = [
        ("initiated", "Initiated"),
        ("paid", "Paid"),
        ("failed", "Failed"),
        ("refunded", "Refunded"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    provider = models.CharField(max_length=50)
    provider_ref = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    CHANNEL_CHOICES = [
        ("email", "Email"),
        ("sms", "SMS"),
        ("whatsapp", "WhatsApp"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    title = models.CharField(max_length=255)
    message = models.TextField()

    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
