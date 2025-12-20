from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Service, Resource, WorkingHours, Slot, Booking, Notification, OTP
from .async_tasks.tasks import booking_created_task, booking_cancelled_task
from .async_tasks.utils import run_task

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "email",
            "full_name",
            "phone_no",
            "password",
            "confirm_password",
            "role",
            "notification_preference",
        )

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        return User.objects.create_user(**validated_data)


class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    purpose = serializers.ChoiceField(choices=OTP.PURPOSE_CHOICES)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs["email"])
        except User.DoesNotExist:
            raise serializers.ValidationError("Invalid user")

        otp = (
            OTP.objects
            .filter(
                user=user,
                code=attrs["otp"],
                purpose=attrs["purpose"],
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp or not otp.is_valid():
            raise serializers.ValidationError("Invalid or expired OTP")

        attrs["user"] = user
        attrs["otp_obj"] = otp
        return attrs


class LoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        key = f"login:{attrs.get('email')}"
        attempts = cache.get(key, 0)

        if attempts >= 5:
            raise serializers.ValidationError("Too many login attempts")

        try:
            data = super().validate(attrs)
        except Exception:
            cache.set(key, attempts + 1, timeout=900)
            raise

        cache.delete(key)

        if not self.user.is_verified:
            raise serializers.ValidationError("User not verified via OTP")

        data["user"] = {
            "id": str(self.user.id),
            "email": self.user.email,
            "full_name": self.user.full_name,
            "role": self.user.role,
        }
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(validators=[validate_password])


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "phone_no",
            "role",
            "notification_preference",
            "notification_consent",
            "is_verified",
        ]
        read_only_fields = ["id", "email", "role", "is_verified"]


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = [
            "id",
            "service",
            "name",
            "type",
            "linked_user",
            "is_active",
        ]
        read_only_fields = ["id"]


class WorkingHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkingHours
        fields = [
            "id",
            "service",
            "resource",
            "day_of_week",
            "start_time",
            "end_time",
        ]
        read_only_fields = ["id"]


class SlotSerializer(serializers.ModelSerializer):
    available = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        fields = [
            "id",
            "service",
            "resource",
            "start_datetime",
            "end_datetime",
            "capacity",
            "booked_count",
            "is_active",
            "available",
        ]

    def get_available(self, obj):
        return obj.booked_count < obj.capacity

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")

        fields["id"].read_only = True
        fields["booked_count"].read_only = True
        fields["service"].read_only = True
        fields["resource"].read_only = True

        if not request or not request.user.is_authenticated:
            for f in ("start_datetime", "end_datetime", "capacity", "is_active"):
                fields[f].read_only = True
            return fields

        role = request.user.role

        if role == "customer":
            for f in ("start_datetime", "end_datetime", "capacity", "is_active"):
                fields[f].read_only = True

        return fields


class ServiceSerializer(serializers.ModelSerializer):
    resources = ResourceSerializer(many=True, read_only=True)
    organiser_name = serializers.CharField(source="organiser.full_name", read_only=True)

    class Meta:
        model = Service
        fields = "__all__"
        read_only_fields = ["id", "created_at", "organiser"]

    def create(self, validated_data):
        validated_data["organiser"] = self.context["request"].user
        return super().create(validated_data)

    def validate_questions_schema(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("questions_schema must be a list")

        allowed_types = {"boolean", "text", "number"}
        keys = set()

        for q in value:
            if not isinstance(q, dict):
                raise serializers.ValidationError("Each question must be an object")

            for field in ("key", "label", "type", "required"):
                if field not in q:
                    raise serializers.ValidationError(f"Missing '{field}' in question")

            if not isinstance(q["key"], str):
                raise serializers.ValidationError("Question key must be a string")

            if q["type"] not in allowed_types:
                raise serializers.ValidationError(
                    f"Invalid type '{q['type']}'. Allowed: boolean, text, number"
                )

            if not isinstance(q["required"], bool):
                raise serializers.ValidationError("'required' must be a boolean")

            if q["key"] in keys:
                raise serializers.ValidationError("Duplicate question key found")

            keys.add(q["key"])

        return value


class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "customer",
            "service",
            "resource",
            "slot",
            "quantity",
            "answers",
            "status",
            "created_at",
            "service_name",
            "customer_name",
        ]
        read_only_fields = [
            "id",
            "customer",
            "service",
            "resource",
            "status",
            "created_at",
        ]

    def validate(self, attrs):
        slot = attrs["slot"]
        if not slot.is_active:
            raise serializers.ValidationError("Slot is inactive")
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        slot = validated_data["slot"]
        quantity = validated_data.get("quantity", 1)

        with transaction.atomic():
            slot = Slot.objects.select_for_update().get(id=slot.id)
            
            if slot.booked_count + quantity > slot.capacity:
                raise serializers.ValidationError("Slot capacity exceeded")

            booking = Booking.objects.create(
                customer=request.user,
                slot=slot,
                service=slot.service,
                resource=slot.resource,
                quantity=quantity,
                answers=validated_data.get("answers", {}),
            )
            slot.booked_count += quantity
            slot.save(update_fields=["booked_count"])
        
        service = booking.service
        if not service.manual_confirmation and not service.advance_payment_required:
            booking.status = "confirmed"
            booking.save(update_fields=["status"])
            transaction.on_commit(
                lambda: run_task(booking_created_task, str(booking.id))
            )

        return booking

    def cancel_booking(self, booking: Booking, user):
        if booking.customer != user:
            raise serializers.ValidationError("Not allowed")

        if booking.status in ("cancelled", "completed"):
            raise serializers.ValidationError("Booking cannot be cancelled")

        with transaction.atomic():
            slot = Slot.objects.select_for_update().get(id=booking.slot_id)
            slot.booked_count = max(0, slot.booked_count - booking.quantity)
            slot.save(update_fields=["booked_count"])

            booking.status = "cancelled"
            booking.save(update_fields=["status"])

        transaction.on_commit(
            lambda: run_task(booking_cancelled_task, str(booking.id))
        )

        return booking

class AdminSlotBookingSerializer(serializers.ModelSerializer):
    bookings = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        fields = [
            "id",
            "start_datetime",
            "end_datetime",
            "capacity",
            "booked_count",
            "bookings",
        ]

    def get_bookings(self, slot):
        qs = Booking.objects.filter(slot=slot).select_related("customer")
        return [
            {
                "booking_id": str(b.id),
                "customer_id": str(b.customer.id),
                "customer_name": b.customer.full_name,
                "customer_email": b.customer.email,
                "customer_phone": b.customer.phone_no or "",
                "quantity": b.quantity,
                "status": b.status,
                "created_at": b.created_at.isoformat(),
                "answers": b.answers,
            }
            for b in qs
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "channel",
            "title",
            "message",
            "is_sent",
            "created_at",
        ]
        read_only_fields = ["id", "created_at", "is_sent"]
