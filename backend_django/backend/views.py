from django.db import transaction
import datetime
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django_ratelimit.decorators import ratelimit
from django.core.cache import cache
from rest_framework import generics, permissions, viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
<<<<<<< Updated upstream
from rest_framework_simplejwt.token_blacklist.models import (
    OutstandingToken,
    BlacklistedToken,
)
from razorpay.errors import SignatureVerificationError
from .models import Service, Resource, Slot, Booking, OTP, Payment
=======
from django.core.cache import cache
import datetime

from .models import Service, Resource, Slot, Booking, OTP
>>>>>>> Stashed changes
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ServiceSerializer,
    ResourceSerializer,
    BookingSerializer,
    VerifyOtpSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)
from .utils import send_otp, get_razorpay_client

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]

        if User.objects.filter(email=email).exists():
            return Response(
                {"message": "If this email is not registered, an OTP will be sent."},
                status=200,
            )

        user = serializer.save()
        send_otp(user, purpose="signup")

        return Response(
            {"message": "If this email is not registered, an OTP will be sent."},
            status=201,
        )


class VerifyOtpView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    # @ratelimit(key="ip", rate="5/m", block=True)
    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        otp = serializer.validated_data["otp_obj"]

        otp.is_used = True
        otp.save()

        if otp.purpose == "signup":
            user.is_verified = True
            user.save()
        cache.delete(f"otp:{user.id}:{otp.purpose}")
        return Response({"message": "OTP verified successfully"})


class LoginView(TokenObtainPairView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer


class PasswordResetRequestView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data["email"])
            send_otp(user, purpose="password_reset")
        except User.DoesNotExist:
            pass

        return Response({"message": "If user exists, OTP sent"})


class PasswordResetConfirmView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(email=serializer.validated_data["email"])
        otp = OTP.objects.filter(
            user=user,
            code=serializer.validated_data["otp"],
            purpose="password_reset",
            is_used=False,
        ).last()

        if not otp or not otp.is_valid():
            return Response({"error": "Invalid OTP"}, status=400)

        user.set_password(serializer.validated_data["new_password"])
        user.save()

        otp.is_used = True
        otp.save()

        return Response({"message": "Password reset successful"})


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not old_password or not new_password:
            return Response(
                {"error": "old_password and new_password are required"},
                status=400,
            )

        if not request.user.check_password(old_password):
            return Response({"error": "Wrong password"}, status=400)

        try:
            validate_password(new_password, user=request.user)
        except ValidationError as e:
            return Response({"error": e.messages}, status=400)

        request.user.set_password(new_password)
        request.user.save()

        for token in OutstandingToken.objects.filter(user=request.user):
            BlacklistedToken.objects.get_or_create(token=token)

        return Response(
            {"message": "Password updated. Please log in again."},
            status=200,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class CreatePaymentOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        booking = Booking.objects.get(
            id=booking_id,
            customer=request.user,
        )

        service = booking.service

        if not service.advance_payment_required:
            return Response(
                {"error": "Payment not required for this booking"},
                status=400,
            )

        amount_paise = int(service.price * 100)

        client = get_razorpay_client()
        order = client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "payment_capture": 1,
            }
        )

        Payment.objects.update_or_create(
            booking=booking,
            defaults={
                "amount": service.price,
                "currency": "INR",
                "razorpay_order_id": order["id"],
                "status": "initiated",
            },
        )

        return Response(
            {
                "razorpay_key": settings.RAZORPAY_KEY_ID,
                "order_id": order["id"],
                "amount": amount_paise,
                "currency": "INR",
            }
        )


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        order_id = request.data.get("order_id")
        payment_id = request.data.get("payment_id")
        signature = request.data.get("signature")

        payment = Payment.objects.get(
            razorpay_order_id=order_id,
            booking__customer=request.user,
        )

        client = get_razorpay_client()

        try:
            client.utility.verify_payment_signature(
                {
                    "razorpay_order_id": order_id,
                    "razorpay_payment_id": payment_id,
                    "razorpay_signature": signature,
                }
            )
        except SignatureVerificationError:
            payment.status = "failed"
            payment.save()
            return Response({"error": "Invalid payment"}, status=400)

        payment.razorpay_payment_id = payment_id
        payment.razorpay_signature = signature
        payment.status = "paid"
        payment.save()

        booking = payment.booking
        booking.status = "confirmed"
        booking.save(update_fields=["status"])

        return Response({"message": "Payment verified"})


class IsOrganiserOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in [
            "organiser",
            "admin",
        ]


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            if self.request.user.role == "admin":
                return Service.objects.all()
            elif self.request.user.role == "organiser":
                return Service.objects.filter(organiser=self.request.user)
        return Service.objects.filter(is_published=True)

    def perform_create(self, serializer):
        serializer.save(organiser=self.request.user)

    @action(detail=True,methods=["post"],permission_classes=[permissions.IsAuthenticatedOrReadOnly],url_path="questions",)
    def add_question(self, request, pk=None):
        with transaction.atomic():
            service = self.get_object()
            question = request.data
            required_fields = {"key", "label", "type", "required"}
            allowed_types = {"text", "boolean", "number"}

            if not required_fields.issubset(question):
                return Response(
                    {"error": "Missing required fields"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if question["type"] not in allowed_types:
                return Response(
                    {"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST
                )
            existing_keys = {q["key"] for q in service.questions_schema}
            if question["key"] in existing_keys:
                return Response(
                    {"error": "Question key already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            service.questions_schema.append(question)
            service.save()
            return Response(
                {"message": "Question added successfully", "question":question},
                status=status.HTTP_201_CREATED,
            )


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [IsOrganiserOrAdmin]
    queryset = Resource.objects.all()


class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Booking.objects.all()
        if user.role == "organiser":
            return Booking.objects.filter(service__organiser=user)
        return Booking.objects.filter(customer=user)

    @action(detail=True, methods=["patch"], url_path="cancel")
    def cancel(self, request, pk=None):
        booking = self.get_object()
        serializers = self.get_serializer()
        serializers.cancel_booking(booking, request.user)
        return Response(
            {"id": booking.id, "status": booking.status}, status=status.HTTP_200_OK
        )


class AvailabilityView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, service_id, date_str):
        try:
            date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
            slots = Slot.objects.filter(
                service_id=service_id,
                start_datetime__date=date,
                is_active=True,
            )

            return Response(
                [
                    {
                        "id": str(slot.id),
                        "start": slot.start_datetime,
                        "end": slot.end_datetime,
                        "available": slot.booked_count < slot.capacity,
                    }
                    for slot in slots
                ]
            )
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class DashboardStatsView(APIView):
    permission_classes = [IsOrganiserOrAdmin]

    def get(self, request):
        user = request.user
        if user.role == "admin":
            return Response(
                {
                    "total_users": User.objects.count(),
                    "total_services": Service.objects.count(),
                    "total_bookings": Booking.objects.count(),
                }
            )

        services = Service.objects.filter(organiser=user)
        return Response(
            {
                "my_services": services.count(),
                "my_bookings": Booking.objects.filter(service__in=services).count(),
                "pending_bookings": Booking.objects.filter(
                    service__in=services,
                    status="pending",
                ).count(),
            }
        )
