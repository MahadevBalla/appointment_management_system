import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Search, Plus, Share2, Edit, Settings, BarChart3, Trash2, AlertCircle } from 'lucide-react';
import { serviceAPI, bookingAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [upcomingCounts, setUpcomingCounts] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, service: null });
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchServices();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredServices(services);
    } else {
      const filtered = services.filter((service) =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await serviceAPI.getServices();
      let servicesList = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data || []);
      
      setServices(servicesList);
      setFilteredServices(servicesList);
      
      // Fetch upcoming bookings count for each service
      if (servicesList.length > 0) {
        await fetchUpcomingCounts(servicesList);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again.');
      setServices([]);
      setFilteredServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingCounts = async (servicesList) => {
    try {
      const bookingsResponse = await bookingAPI.getBookings();
      const bookings = Array.isArray(bookingsResponse.data) 
        ? bookingsResponse.data 
        : (bookingsResponse.data?.results || []);
      
      const counts = {};
      for (const service of servicesList) {
        const upcoming = bookings.filter(
          (booking) =>
            (booking.service === service.id || booking.service_id === service.id) &&
            booking.status === 'confirmed' &&
            booking.slot &&
            new Date(booking.slot.start_datetime) > new Date()
        );
        counts[service.id] = upcoming.length;
      }
      setUpcomingCounts(counts);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      // Set zero counts on error
      const counts = {};
      servicesList.forEach((service) => {
        counts[service.id] = 0;
      });
      setUpcomingCounts(counts);
    }
  };

  const handleShare = (service) => {
    const shareToken = service.share_token || service.id;
    const shareUrl = `${window.location.origin}/book/${shareToken}`;
    
    if (navigator.share) {
      navigator.share({
        title: service.name,
        text: `Book an appointment: ${service.name}`,
        url: shareUrl,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(shareUrl);
      setSuccess('Share link copied to clipboard!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleEdit = (service) => {
    navigate(`/dashboard/${service.id}/edit`);
  };

  const handleDeleteClick = (service) => {
    setDeleteDialog({ open: true, service });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.service) return;

    try {
      setDeleting(true);
      setError('');
      
      await serviceAPI.deleteService(deleteDialog.service.id);
      
      setSuccess(`Service "${deleteDialog.service.name}" deleted successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh services list
      await fetchServices();
      
      setDeleteDialog({ open: false, service: null });
    } catch (error) {
      console.error('Error deleting service:', error);
      setError(error.response?.data?.error || 'Failed to delete service. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, service: null });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatResources = (resources) => {
    if (!resources || resources.length === 0) return 'No resources';
    return resources.map((r) => r.name).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading services...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your services</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/reporting')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Reporting
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings/resources')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button
              onClick={() => navigate('/dashboard/new')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Service
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Service Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Resources/Users</TableHead>
                <TableHead>Upcoming Bookings</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {searchQuery 
                      ? 'No services found matching your search.'
                      : 'No services found. Create your first service by clicking "New Service".'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{formatDuration(service.duration_minutes)}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatResources(service.resources)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {upcomingCounts[service.id] || 0} Booking{upcomingCounts[service.id] !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      {service.is_published ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="outline">Unpublished</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(service)}
                          className="flex items-center gap-1"
                          title="Share booking link"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(service)}
                          className="flex items-center gap-1"
                          title="Edit service"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(service)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ open, service: deleteDialog.service })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.service?.name}"? 
              This action cannot be undone and will remove all associated bookings and slots.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;