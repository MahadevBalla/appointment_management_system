from celery import shared_task
from django.core.exceptions import ObjectDoesNotExist
from ..models import Booking
from ..utils import send_notification

@shared_task(
    bind=True, 
    autoretry_for=(Exception,), 
    retry_kwargs={"max_retries": 5}, 
    soft_time_limit=10, 
    time_limit=15,
    queue="notifications"
)
def booking_created_task(self, booking_id):
    try:
        booking = Booking.objects.select_related("customer", "service").get(id=booking_id)
    except ObjectDoesNotExist:
        return

    if booking.status != "confirmed":
        return

    send_notification(
        booking.customer,
        "Booking Confirmed",
        f"Your booking for {booking.service.name} is confirmed."
    )

@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 5},
    soft_time_limit=10,
    time_limit=15,
    queue="notifications",
)
def booking_cancelled_task(self, booking_id):
    try:
        booking = Booking.objects.select_related("customer").get(id=booking_id)
    except ObjectDoesNotExist:
        return

    if booking.status != "cancelled":
        return

    send_notification(
        booking.customer,
        "Booking Cancelled",
        "Your booking has been cancelled."
    )
