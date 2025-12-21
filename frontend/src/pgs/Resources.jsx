import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Alert } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Check,
  Search,
  ArrowLeft
} from 'lucide-react';
import { resourceAPI, serviceAPI } from '../services/api';

const Resources = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [services, setServices] = useState([]);
  
  // Form dialog state
  const [formDialog, setFormDialog] = useState({ open: false, mode: 'create', resource: null });
  const [formData, setFormData] = useState({
    name: '',
    type: 'user',
    service: '',
    linked_user: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, resource: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchResources();
    fetchServices();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredResources(resources);
    } else {
      const filtered = resources.filter((resource) =>
        resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResources(filtered);
    }
  }, [searchQuery, resources]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await resourceAPI.getResources();
      let resourcesList = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || response.data || []);
      
      setResources(resourcesList);
      setFilteredResources(resourcesList);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources. Please try again.');
      setResources([]);
      setFilteredResources([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await serviceAPI.getServices();
      const servicesList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleCreateClick = () => {
    setFormData({
      name: '',
      type: 'user',
      service: '',
      linked_user: ''
    });
    setFormDialog({ open: true, mode: 'create', resource: null });
  };

  const handleEditClick = (resource) => {
    setFormData({
      name: resource.name || '',
      type: resource.type || 'user',
      service: resource.service || '',
      linked_user: resource.linked_user || ''
    });
    setFormDialog({ open: true, mode: 'edit', resource });
  };

  const handleDeleteClick = (resource) => {
    setDeleteDialog({ open: true, resource });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (formDialog.mode === 'create') {
        await resourceAPI.createResource(formData);
        setSuccess('Resource created successfully!');
      } else {
        await resourceAPI.updateResource(formDialog.resource.id, formData);
        setSuccess('Resource updated successfully!');
      }

      setTimeout(() => setSuccess(''), 3000);
      setFormDialog({ open: false, mode: 'create', resource: null });
      await fetchResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      setError(error.response?.data?.error || error.response?.data?.detail || 'Failed to save resource. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.resource) return;

    try {
      setDeleting(true);
      setError('');
      
      await resourceAPI.deleteResource(deleteDialog.resource.id);
      
      setSuccess(`Resource "${deleteDialog.resource.name}" deleted successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      await fetchResources();
      setDeleteDialog({ open: false, resource: null });
    } catch (error) {
      console.error('Error deleting resource:', error);
      setError(error.response?.data?.error || 'Failed to delete resource. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const getTypeLabel = (type) => {
    return type === 'user' ? 'Staff/User' : 'Asset/Room';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {error && (
          <Alert 
            icon={<AlertCircle size={16} />} 
            color="red" 
            mb="md" 
            onClose={() => setError('')} 
            withCloseButton
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            icon={<Check size={16} />} 
            color="green" 
            mb="md" 
            onClose={() => setSuccess('')} 
            withCloseButton
          >
            {success}
          </Alert>
        )}

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
              <h1 className="text-3xl font-bold text-gray-900">Resources</h1>
              <p className="text-sm text-gray-500 mt-1">Manage staff and assets for your services</p>
            </div>
          </div>
          <Button
            onClick={handleCreateClick}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Resource
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Resources Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Resource Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Linked User</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {searchQuery 
                      ? 'No resources found matching your search.'
                      : 'No resources found. Create your first resource by clicking "New Resource".'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getTypeLabel(resource.type)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {resource.service_name || resource.service || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {resource.linked_user_name || resource.linked_user || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(resource)}
                          className="flex items-center gap-1"
                          title="Edit resource"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(resource)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete resource"
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

      {/* Create/Edit Resource Dialog */}
      <Dialog open={formDialog.open} onOpenChange={(open) => !saving && setFormDialog({ ...formDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formDialog.mode === 'create' ? 'Create New Resource' : 'Edit Resource'}
            </DialogTitle>
            <DialogDescription>
              {formDialog.mode === 'create' 
                ? 'Add a new staff member or asset to your resources.'
                : 'Update the resource information.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter resource name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="user">Staff/User</option>
                  <option value="asset">Asset/Room</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Service *</Label>
                <select
                  id="service"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linked_user">Linked User ID</Label>
                <Input
                  id="linked_user"
                  value={formData.linked_user}
                  onChange={(e) => setFormData({ ...formData, linked_user: e.target.value })}
                  placeholder="Enter user UUID"
                />
                <p className="text-xs text-gray-500">
                  Optional: For staff resources, link to a user account
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setFormDialog({ open: false, mode: 'create', resource: null })}
                disabled={saving}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : (formDialog.mode === 'create' ? 'Create' : 'Update')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !deleting && setDeleteDialog({ open, resource: deleteDialog.resource })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.resource?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, resource: null })}
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

export default Resources;