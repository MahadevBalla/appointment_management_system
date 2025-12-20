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

    email = models.EmailField(unique=True, db_index=True)
    phone_no = models.CharField(max_length=15, blank=True, null=True, db_index=True)

    full_name = models.CharField(max_length=255)

    notification_preference = models.CharField(
        max_length=20,
        choices=NOTIFICATION_PREF_CHOICES,
        default="email",
    )
    notification_consent = models.BooleanField(default=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer", db_index=True)
    is_verified = models.BooleanField(default=False, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="otps")
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)

    expires_at = models.DateTimeField(db_index=True)
    is_used = models.BooleanField(default=False, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at

    class Meta:
        indexes = [
            models.Index(fields=["user", "purpose", "is_used"]),
            models.Index(fields=["expires_at"]),
        ]


class Service(models.Model):
    organiser = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="services", db_index=True
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

    is_published = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Resource(models.Model):
    TYPE_CHOICES = [
        ("user", "Staff/User"),
        ("asset", "Asset/Room"),
    ]

    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="resources", db_index=True
    )

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)

    linked_user = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )

    is_active = models.BooleanField(default=True, db_index=True)


class WorkingHours(models.Model):
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
        ],
        db_index=True
    )

    start_time = models.TimeField()
    end_time = models.TimeField()

    def clean(self):
        if self.resource and self.resource.service_id != self.service_id:
            raise ValidationError(
                "WorkingHours.resource must belong to the same service."
            )

    class Meta:
        indexes = [
            models.Index(fields=["service", "day_of_week"]),
            models.Index(fields=["resource", "day_of_week"]),
        ]


class Slot(models.Model):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, db_index=True)
    resource = models.ForeignKey(
        Resource, null=True, blank=True, on_delete=models.CASCADE, db_index=True
    )

    start_datetime = models.DateTimeField(db_index=True)
    end_datetime = models.DateTimeField()

    capacity = models.PositiveIntegerField()
    booked_count = models.PositiveIntegerField()

    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["resource", "start_datetime"],
                name="uniq_resource_start",
                condition=models.Q(resource__isnull=False),
            )
        ]
        indexes = [
            models.Index(fields=["service", "start_datetime"]),
            models.Index(fields=["resource", "start_datetime"]),
            models.Index(
                fields=["start_datetime"],
                name="active_slots_idx",
                condition=models.Q(is_active=True),
            ),
        ]



class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    customer = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    service = models.ForeignKey(Service, on_delete=models.CASCADE, db_index=True)
    resource = models.ForeignKey(
        Resource, null=True, blank=True, on_delete=models.SET_NULL
    )
    slot = models.ForeignKey(Slot, on_delete=models.PROTECT, db_index=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        db_index=True,
    )
    answers = models.JSONField(default=dict)

    created_at = models.DateTimeField(auto_now_add=True)

    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        indexes = [
            models.Index(fields=["customer", "status"]),
            models.Index(fields=["service", "status"]),
            models.Index(fields=["created_at"]),
        ]

    def clean(self):
        if self.service_id != self.slot.service_id:
            raise ValidationError("Booking.service must match slot.service")

        if self.slot.resource and self.resource_id != self.slot.resource_id:
            raise ValidationError("Booking.resource must match slot.resource")

        if self.resource and self.resource.service_id != self.service_id:
            raise ValidationError("Resource does not belong to booking service")


class Payment(models.Model):
    PROVIDER_CHOICES = [
        ("razorpay", "Razorpay"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE)

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="INR")

    provider = models.CharField(
        max_length=50,
        choices=PROVIDER_CHOICES,
        default="razorpay",
    )

    razorpay_order_id = models.CharField(max_length=100, blank=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ("initiated", "Initiated"),
            ("paid", "Paid"),
            ("failed", "Failed"),
            ("refunded", "Refunded"),
        ],
        default="initiated",
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)


class Notification(models.Model):
    CHANNEL_CHOICES = [
        ("email", "Email"),
        ("sms", "SMS"),
        ("whatsapp", "WhatsApp"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)

    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, db_index=True)
    title = models.CharField(max_length=255)
    message = models.TextField()

    is_sent = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_sent"]),
            models.Index(fields=["created_at"]),
        ]
