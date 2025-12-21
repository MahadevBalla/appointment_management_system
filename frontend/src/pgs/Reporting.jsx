import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings as SettingsIcon,
  BarChart3,
  Calendar,
  ArrowLeft,
  User,
  Clock,
  MapPin,
  Phone,
  Mail,
  FileText
} from 'lucide-react';

const Reporting = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Tab state
  const [activeTab, setActiveTab] = useState('Appointmanrts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Appointments/bookings data from API
  const [appointments, setAppointments] = useState([]);
  
  // Dialog state for booking details
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchAppointments();
  }, [isAuthenticated, navigate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('http://localhost:8000/api/admin/bookings/', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Bookings data:', data);

      // Transform API data to match appointments format
      const transformedAppointments = data.map(booking => ({
        id: booking.id,
        name: booking.customer_name || 'N/A',
        time: booking.slot_details?.start_datetime
          ? new Date(booking.slot_details.start_datetime).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
          })
          : 'N/A',
        resource: booking.resource_details?.name || '',
        answers: booking.customer_phone || Object.values(booking.answers || {}).join(', ') || '',
        selected: false,
        service: booking.service_details?.name || 'N/A',
        status: booking.status,
        // Store full booking details for dialog
        fullDetails: booking
      }));

      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load appointments. Please try again.');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked) => {
    setAppointments(appointments.map(apt => ({ ...apt, selected: checked })));
  };

  const handleSelectAppointment = (id, checked) => {
    setAppointments(appointments.map(apt =>
      apt.id === id ? { ...apt, selected: checked } : apt
    ));
  };

  const handleRowClick = (appointment) => {
    setSelectedBooking(appointment.fullDetails);
    setDialogOpen(true);
  };

  const allSelected = appointments.length > 0 && appointments.every(apt => apt.selected);
  const someSelected = appointments.some(apt => apt.selected) && !allSelected;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admindashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />

            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <button
              onClick={() => setActiveTab('Appointmanrts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'Appointmanrts'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Appointmanrts
            </button>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Answers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow 
                  key={appointment.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleRowClick(appointment)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={appointment.selected}
                      onCheckedChange={(checked) => handleSelectAppointment(appointment.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{appointment.name}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.service}</TableCell>
                  <TableCell>{appointment.resource || '-'}</TableCell>
                  <TableCell className="text-gray-600">{appointment.answers}</TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No appointments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Booking Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about this booking
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6 py-4">
              {/* Customer Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-sm font-medium">{selectedBooking.customer_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedBooking.customer_email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedBooking.customer_phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      selectedBooking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : selectedBooking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : selectedBooking.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Service Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="text-sm font-medium">{selectedBooking.service_details?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Resource</p>
                    <p className="text-sm font-medium">{selectedBooking.resource_details?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="text-sm font-medium">{selectedBooking.quantity || 1}</p>
                  </div>
                </div>
              </div>

              {/* Time Information */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p className="text-sm font-medium">
                      {selectedBooking.slot_details?.start_datetime
                        ? new Date(selectedBooking.slot_details.start_datetime).toLocaleString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p className="text-sm font-medium">
                      {selectedBooking.slot_details?.end_datetime
                        ? new Date(selectedBooking.slot_details.end_datetime).toLocaleString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Booked At</p>
                    <p className="text-sm font-medium">
                      {selectedBooking.created_at
                        ? new Date(selectedBooking.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Answers */}
              {selectedBooking.answers && Object.keys(selectedBooking.answers).length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700">Customer Responses</h3>
                  <div className="space-y-2 pl-6">
                    {Object.entries(selectedBooking.answers).map(([key, value]) => (
                      <div key={key} className="grid grid-cols-3 gap-4">
                        <p className="text-sm text-gray-500 font-medium">{key}:</p>
                        <p className="text-sm col-span-2">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              {selectedBooking.payment_status && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-700">Payment Information</h3>
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <p className="text-sm font-medium">{selectedBooking.payment_status}</p>
                    </div>
                    {selectedBooking.transaction_id && (
                      <div>
                        <p className="text-sm text-gray-500">Transaction ID</p>
                        <p className="text-sm font-mono text-xs">{selectedBooking.transaction_id}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Booking ID */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500">Booking ID</p>
                <p className="text-xs font-mono text-gray-600">{selectedBooking.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reporting;
