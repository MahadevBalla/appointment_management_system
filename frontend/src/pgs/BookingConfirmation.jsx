import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react';

const BookingConfirmation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);

    // Helper function to get auth token
    const getAuthToken = () => {
        const tokens = localStorage.getItem("authTokens")
            ? JSON.parse(localStorage.getItem("authTokens"))
            : sessionStorage.getItem("authTokens")
                ? JSON.parse(sessionStorage.getItem("authTokens"))
                : null;
        return tokens?.access || null;
    };

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/bookings/${id}/`, {
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch booking details');
                }

                const data = await response.json();

                // Transform API data to match component structure
                const slot = data.slot_details;
                const startDate = new Date(slot.start_datetime);
                const endDate = new Date(slot.end_datetime);

                const dateStr = startDate.toISOString().split('T')[0];
                const startTime = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const endTime = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                const transformedData = {
                    appointment: {
                        name: data.service_details.name,
                        duration: `${data.service_details.duration} min`,
                        type: data.service_details.advance_payment_required ? 'Paid' : 'Free'
                    },
                    resource: {
                        name: data.resource_details?.name || 'No Resource'
                    },
                    selectedDate: dateStr,
                    selectedTime: `${startTime} - ${endTime}`,
                    numberOfPeople: data.quantity,
                    manageCapacity: data.service_details.manage_capacity,
                    status: data.status,
                    venue: {
                        name: data.service_details.venue_name || "Venue",
                        address: data.service_details.venue_address || "Address",
                        city: data.service_details.venue_city || "City",
                        state: data.service_details.venue_state || "State"
                    },
                    customerDetails: {
                        name: data.customer_name,
                        email: data.customer_email,
                        phone: data.customer_phone
                    }
                };

                setBookingData(transformedData);
            } catch (err) {
                console.error('Error fetching booking:', err);
                setError('Failed to load booking details');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBookingDetails();
        }
    }, [id]);

    const handleCancelAppointment = async () => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            setCancelling(true);
            try {
                const response = await fetch(`http://localhost:8000/api/bookings/${id}/cancel/`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    }
                });

                if (response.ok) {
                    navigate('/customerhome');
                } else {
                    alert('Failed to cancel booking');
                }
            } catch (error) {
                console.error('Error cancelling booking:', error);
                alert('Error cancelling booking');
            } finally {
                setCancelling(false);
            }
        }
    };

    const handleGoogleCalendar = () => {
        if (!bookingData) return;

        const eventTitle = encodeURIComponent(`${bookingData.appointment.name} - ${bookingData.resource.name}`);
        const eventDetails = encodeURIComponent(`Booking at ${bookingData.venue.name}`);
        const eventLocation = encodeURIComponent(`${bookingData.venue.address}, ${bookingData.venue.city}, ${bookingData.venue.state}`);

        // Parse date and time
        // Assuming selectedTime format is "HH:MM:SS - HH:MM:SS"
        const [startTimeStr, endTimeStr] = bookingData.selectedTime.split(' - ');
        const dateStr = bookingData.selectedDate;

        const startDateTime = new Date(`${dateStr}T${startTimeStr}`);
        const endDateTime = new Date(`${dateStr}T${endTimeStr}`);

        const startTime = startDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const endTime = endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${startTime}/${endTime}&details=${eventDetails}&location=${eventLocation}`;
        window.open(googleCalendarUrl, '_blank');
    };

    const handleOutlookCalendar = () => {
        if (!bookingData) return;

        const eventTitle = encodeURIComponent(`${bookingData.appointment.name} - ${bookingData.resource.name}`);
        const eventDetails = encodeURIComponent(`Booking at ${bookingData.venue.name}`);
        const eventLocation = encodeURIComponent(`${bookingData.venue.address}, ${bookingData.venue.city}, ${bookingData.venue.state}`);

        const [startTimeStr, endTimeStr] = bookingData.selectedTime.split(' - ');
        const dateStr = bookingData.selectedDate;

        const startDateTime = new Date(`${dateStr}T${startTimeStr}`);
        const endDateTime = new Date(`${dateStr}T${endTimeStr}`);

        const startTime = startDateTime.toISOString();
        const endTime = endDateTime.toISOString();

        const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${eventTitle}&body=${eventDetails}&location=${eventLocation}&startdt=${startTime}&enddt=${endTime}`;
        window.open(outlookUrl, '_blank');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading booking details...</p>
            </div>
        );
    }

    if (error || !bookingData) {
        return (
            <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Booking not found'}</p>
                    <Button onClick={() => navigate('/customerhome')}>
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-gray-50 py-8">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Confirmation Card */}
                <div className="bg-white rounded-lg shadow-lg border-2 border-teal-500 overflow-hidden">
                    {/* Header with Confirmation Badge */}
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6">
                        <div className="flex items-center justify-center mb-4">
                            <Badge className="bg-white text-teal-700 hover:bg-white text-lg px-6 py-2 border-2 border-teal-700">
                                Booking confirmed
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold text-white text-center">
                            {bookingData.appointment.name}
                        </h1>
                        <p className="text-teal-50 text-center mt-2">
                            {bookingData.resource.name}
                        </p>
                        {bookingData.appointment.type && (
                            <div className="flex justify-center mt-3">
                                <Badge
                                    className={`${bookingData.appointment.type === 'Paid'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-green-100 text-green-800'
                                        } hover:bg-opacity-90`}
                                >
                                    {bookingData.appointment.type}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {/* Booking Details */}
                    <div className="px-8 py-8 space-y-6">
                        {/* Time Section */}
                        <div className="border-b border-gray-200 pb-6">
                            <div className="flex items-start gap-4">
                                <Calendar className="h-6 w-6 text-teal-600 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Time</h3>
                                    <p className="text-2xl font-bold text-teal-700 mb-4">
                                        {formatDate(bookingData.selectedDate)}, {bookingData.selectedTime}
                                    </p>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleGoogleCalendar}
                                            variant="outline"
                                            size="sm"
                                            className="border-teal-600 text-teal-700 hover:bg-teal-50"
                                        >
                                            Google calendar
                                        </Button>
                                        <Button
                                            onClick={handleOutlookCalendar}
                                            variant="outline"
                                            size="sm"
                                            className="border-teal-600 text-teal-700 hover:bg-teal-50"
                                        >
                                            Outlook calendar
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Duration Section */}
                        <div className="border-b border-gray-200 pb-6">
                            <div className="flex items-start gap-4">
                                <Clock className="h-6 w-6 text-teal-600 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Duration</h3>
                                    <p className="text-xl font-semibold text-gray-700">
                                        {bookingData.appointment.duration}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Number of People (Conditional) */}
                        {bookingData.manageCapacity && bookingData.numberOfPeople && (
                            <div className="border-b border-gray-200 pb-6">
                                <div className="flex items-start gap-4">
                                    <Users className="h-6 w-6 text-teal-600 mt-1" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            No of people : {bookingData.numberOfPeople} (If manage capacity is checked)
                                        </h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Venue Section */}
                        <div className="border-b border-gray-200 pb-6">
                            <div className="flex items-start gap-4">
                                <MapPin className="h-6 w-6 text-teal-600 mt-1" />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Venue</h3>
                                    <div className="text-gray-700 space-y-1">
                                        <p className="font-semibold">{bookingData.venue.name}</p>
                                        <p>{bookingData.venue.address}</p>
                                        <p>{bookingData.venue.city}</p>
                                        <p>{bookingData.venue.state}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Confirmation Message */}
                        {bookingData.status === 'confirmed' && (
                            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                                <p className="text-sm text-gray-600 italic text-center mb-2">
                                    Your booking has been successfully confirmed
                                </p>
                                <p className="text-gray-800 text-center font-medium">
                                    Thank you for your trust. We look forward to serving you!
                                </p>
                            </div>
                        )}

                        {/* Cancel Button */}
                        <div className="pt-4 flex justify-center">
                            <Button
                                onClick={handleCancelAppointment}
                                disabled={cancelling}
                                variant="outline"
                                className="border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 px-8 py-6 text-lg font-semibold"
                            >
                                {cancelling ? 'Cancelling...' : 'Cancel your booking'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Back to Dashboard */}
                <div className="mt-6 text-center">
                    <Button
                        onClick={() => navigate('/customerhome')}
                        variant="ghost"
                        className="text-teal-600 hover:text-teal-700"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default BookingConfirmation;