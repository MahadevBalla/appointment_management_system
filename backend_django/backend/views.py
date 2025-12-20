from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django_ratelimit.decorators import ratelimit
from rest_framework import generics, permissions, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
import datetime

from .models import Service, Resource, Slot, Booking, OTP
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
from .utils import send_otp

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

    @ratelimit(key="ip", rate="5/m", block=True)
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


class IsOrganiserOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["organiser", "admin"]
        )


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

            return Response([
                {
                    "id": str(slot.id),
                    "start": slot.start_datetime,
                    "end": slot.end_datetime,
                    "available": slot.booked_count < slot.capacity,
                }
                for slot in slots
            ])
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class DashboardStatsView(APIView):
    permission_classes = [IsOrganiserOrAdmin]

    def get(self, request):
        user = request.user
        if user.role == "admin":
            return Response({
                "total_users": User.objects.count(),
                "total_services": Service.objects.count(),
                "total_bookings": Booking.objects.count(),
            })

        services = Service.objects.filter(organiser=user)
        return Response({
            "my_services": services.count(),
            "my_bookings": Booking.objects.filter(service__in=services).count(),
            "pending_bookings": Booking.objects.filter(
                service__in=services,
                status="pending",
            ).count(),
        })
