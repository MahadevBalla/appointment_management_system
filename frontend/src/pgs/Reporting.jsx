import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  ArrowLeft
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
        status: booking.status
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
                <TableHead>Resource</TableHead>
                <TableHead>Answers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <Checkbox
                      checked={appointment.selected}
                      onCheckedChange={(checked) => handleSelectAppointment(appointment.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{appointment.name}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.resource || '-'}</TableCell>
                  <TableCell className="text-gray-600">{appointment.answers}</TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No appointments found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Reporting;
