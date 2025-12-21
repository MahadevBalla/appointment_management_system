from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    ServiceViewSet,
    ResourceViewSet,
    BookingViewSet,
    AvailabilityView,
    DashboardStatsView,
    VerifyOtpView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    ChangePasswordView,
    CreatePaymentOrderView,
    VerifyPaymentView,
    AdminUserListView,
    AdminUserToggleStatusView,
    AdminBookingListView,
    AdminServiceSlotsView,
    AdminServiceSlotsView,
    AdminBookingDeleteView,
    AdminSlotCreateView,
    AdminSlotDeleteView,
)
from .agent.views import AgentExecuteView

router = DefaultRouter()
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"resources", ResourceViewSet, basename="resource")
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/verify-otp/", VerifyOtpView.as_view()),
    path("auth/password-reset/request/", PasswordResetRequestView.as_view()),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view()),
    path("auth/password/change/", ChangePasswordView.as_view()),
    path("profile/", ProfileView.as_view()),
    path(
        "availability/<int:service_id>/<str:date_str>/",
        AvailabilityView.as_view(),
    ),
    path("dashboard/stats/", DashboardStatsView.as_view()),
    path("payments/create-order/", CreatePaymentOrderView.as_view()),
    path("payments/verify/", VerifyPaymentView.as_view()),
    path("agent/execute/", AgentExecuteView.as_view()),
    path("admin/users/", AdminUserListView.as_view()),
    path("admin/users/<uuid:user_id>/toggle-status/", AdminUserToggleStatusView.as_view()),
    path("admin/bookings/", AdminBookingListView.as_view()),
    path("admin/services/<int:service_id>/slots/", AdminServiceSlotsView.as_view()),
    path("admin/services/<int:service_id>/slots/create/", AdminSlotCreateView.as_view()),
    path("admin/slots/<int:pk>/", AdminSlotDeleteView.as_view()),
    path("admin/bookings/<uuid:booking_id>/", AdminBookingDeleteView.as_view()),
    path("", include(router.urls)),
]
