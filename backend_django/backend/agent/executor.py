from .actions import AGENT_ACTIONS
from .internal import internal_get, internal_post
from backend.views import (
    ServiceViewSet,
    AvailabilityView,
    BookingViewSet,
    CreatePaymentOrderView,
)


def execute_action(action, params, request):
    user = request.user

    if action == "list_services":
        view = ServiceViewSet.as_view({"get": "list"})
        resp = internal_get(view, "/api/services/", user)
        services = resp.data

        # AUTO-LOCK if only one service exists
        context = {}
        if len(services) == 1:
            context["service_id"] = services[0]["id"]

        return {"data": services, "context": context}

    if action == "check_availability":
        view = AvailabilityView.as_view()
        resp = internal_get(
            view,
            f"/api/availability/{params['service_id']}/{params['date']}/",
            user,
            service_id=params["service_id"],
            date_str=params["date"],
        )
        context = params.copy()
        context["slots"] = resp.data
        return {"data": resp.data, "context": context}

    if action == "create_booking":
        view = BookingViewSet.as_view({"post": "create"})
        resp = internal_post(
            view,
            "/api/bookings/",
            user,
            {
                "slot": params["slot_id"],
                "answers": params.get("answers", {}),
            },
        )
        return {"data": resp.data, "context": {"booking_id": resp.data["id"]}}

    if action == "create_payment_order":
        view = CreatePaymentOrderView.as_view()
        resp = internal_post(
            view,
            "/api/payments/create-order/",
            user,
            {"booking_id": params["booking_id"]},
        )
        return {"data": resp.data, "context": {}}

    raise ValueError("Invalid action")
