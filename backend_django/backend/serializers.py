from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Service, Resource, WorkingHours, Slot, Booking, Notification, OTP

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

        otp = OTP.objects.filter(
            user=user,
            code=attrs["otp"],
            purpose=attrs["purpose"],
            is_used=False,
        ).last()

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
        read_only_fields = ["id", "email", "is_verified"]


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = "__all__"
        read_only_fields = ["id"]


class WorkingHoursSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkingHours
        fields = "__all__"
        read_only_fields = ["id"]


class SlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = "__all__"
        read_only_fields = ["id", "booked_count"]


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


class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)

    class Meta:
        model = Booking
        fields = "__all__"
        read_only_fields = [
            "id",
            "customer",
            "created_at",
            "status",
            "service",
            "resource",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        slot = validated_data["slot"]
        quantity = validated_data.get("quantity", 1)

        with transaction.atomic():
            slot = Slot.objects.select_for_update().get(id=slot.id)
            if slot.booked_count + quantity > slot.capacity:
                raise serializers.ValidationError(
                    {"capacity": "Slot capacity exceeded"}
                )
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
        return booking

    def cancel_booking(self, booking: Booking, user):
        if booking.customer != user:
            raise serializers.ValidationError("Not allowed")
        if booking.status == "cancelled":
            raise serializers.ValidationError("Booking already cancelled")
        if booking.status == "completed":
            raise serializers.ValidationError("Completed booking, cannot be cancelled")
        with transaction.atomic():
            slot = Slot.objects.select_for_update().get(id=booking.slot_id)
            slot.booked_count = max(0, slot.booked_count - booking.quantity)
            slot.save(update_fields=["booked_count"])
            booking.status = "cancelled"
            booking.save(update_fields=["status"])
            return booking


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ["id", "created_at", "is_sent"]
