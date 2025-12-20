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
)

router = DefaultRouter()
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"resources", ResourceViewSet, basename="resource")
router.register(r"bookings", BookingViewSet, basename="booking")

urlpatterns = [
    path("auth/register/", RegisterView.as_view()),
    path("auth/login/", LoginView.as_view()),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("profile/", ProfileView.as_view()),
    path(
        "availability/<uuid:service_id>/<str:date_str>/",
        AvailabilityView.as_view(),
    ),
    path("dashboard/stats/", DashboardStatsView.as_view()),
    path("", include(router.urls)),
]
