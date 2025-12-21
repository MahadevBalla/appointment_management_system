import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { bookingAPI } from '../services/api';

const CustomerBookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsDialog, setDetailsDialog] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBookings();
  }, [isAuthenticated, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookingAPI.getBookings();
      const bookingsList = Array.isArray(response.data) 
        ? response.data 
        : response.data?.results || [];
      setBookings(bookingsList);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsDialog(true);
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'completed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getEndTime = (startTimeString, durationMinutes) => {
    if (!startTimeString || !durationMinutes) return 'N/A';
    try {
      const startDate = new Date(startTimeString);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      return endDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your bookings...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customerhome')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-sm text-gray-500 mt-1">View and manage your appointments</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-800" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Bookings Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No bookings found. Book your first appointment!
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => {
                  const startTime = booking.slot_details?.start_datetime;
                  const endTime = booking.slot_details?.end_datetime;
                  const location = booking.service_details?.location || 'N/A';
                  
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {booking.service_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          {formatDate(startTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>
                            {formatTime(startTime)}
                            {endTime && <> - {formatTime(endTime)}</>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(booking.status)}>
                          {booking.status || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(booking)}
                            className="flex items-center gap-1"
                          >
                            <FileText className="h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Booking Details Dialog */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about your booking
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 py-4">
              {/* Service Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Service Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Service Name</p>
                    <p className="text-sm font-medium">{selectedBooking.service_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="text-sm font-medium">{selectedBooking.service_details?.duration || 'N/A'} minutes</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge className={getStatusBadgeColor(selectedBooking.status)}>
                      {selectedBooking.status || 'Pending'}
                    </Badge>
                  </div>
                  {selectedBooking.resource_details && (
                    <div>
                      <p className="text-xs text-gray-500">Resource</p>
                      <p className="text-sm font-medium">{selectedBooking.resource_details.name}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Date & Time</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-sm font-medium">{formatDate(selectedBooking.slot_details?.start_datetime)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="text-sm font-medium">
                        {formatTime(selectedBooking.slot_details?.start_datetime)}
                        {selectedBooking.slot_details?.end_datetime && (
                          <> - {formatTime(selectedBooking.slot_details?.end_datetime)}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedBooking.service_details?.location && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{selectedBooking.service_details.location}</p>
                  </div>
                </div>
              )}

              {/* Answers */}
              {selectedBooking.answers && selectedBooking.answers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Responses</h3>
                  <div className="space-y-2">
                    {selectedBooking.answers.map((answer, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-md">
                        <p className="text-xs text-gray-500">{answer.question_text || `Question ${index + 1}`}</p>
                        <p className="text-sm font-medium">{answer.answer || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {selectedBooking.payment_status && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-sm font-medium">₹{selectedBooking.payment_amount || '0'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge className={selectedBooking.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                        : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}>
                        {selectedBooking.payment_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking ID */}
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">Booking ID</p>
                <p className="text-sm font-mono">{selectedBooking.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerBookings;
