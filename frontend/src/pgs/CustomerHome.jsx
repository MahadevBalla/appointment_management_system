import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { serviceAPI } from '../services/api';

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch services from API
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await serviceAPI.getServices();
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter services based on search and type
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'All' ||
      (selectedType === 'Paid' && service.advance_payment_required) ||
      (selectedType === 'Free' && !service.advance_payment_required);

    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.full_name || 'Guest'}!
          </h1>
          <p className="text-gray-600">Browse and book available appointments</p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search appointments..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedType === 'All' ? 'default' : 'outline'}
              onClick={() => setSelectedType('All')}
              className={selectedType === 'All' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              All
            </Button>
            <Button
              variant={selectedType === 'Free' ? 'default' : 'outline'}
              onClick={() => setSelectedType('Free')}
              className={selectedType === 'Free' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              Free
            </Button>
            <Button
              variant={selectedType === 'Paid' ? 'default' : 'outline'}
              onClick={() => setSelectedType('Paid')}
              className={selectedType === 'Paid' ? 'bg-teal-600 hover:bg-teal-700' : ''}
            >
              Paid
            </Button>
          </div>
        </div>

        {/* Appointments Label */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Appointments</h2>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading services...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={fetchServices} 
              variant="outline" 
              className="mt-2"
              size="sm"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Appointments Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/customer/appointment/${service.id}`)}
              >
                <div className="p-6">
                  <div className="flex gap-6">
                    {/* Picture Placeholder */}
                    <div className="w-48 h-48 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200">
                      <span className="text-gray-400 text-sm">Picture</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {service.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={
                            service.advance_payment_required
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                              : 'bg-green-50 text-green-700 border-green-300'
                          }
                        >
                          {service.advance_payment_required ? 'Paid' : 'Free'}
                        </Badge>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Duration:</span>
                        <span className="text-gray-600 ml-2">{service.duration_minutes} minutes</span>
                      </div>

                      {service.price > 0 && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Price:</span>
                          <span className="text-gray-600 ml-2">₹{parseFloat(service.price).toFixed(2)}</span>
                        </div>
                      )}

                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Capacity:</span>
                        <span className="text-gray-600 ml-2">{service.capacity_per_slot} per slot</span>
                      </div>

                      {service.description && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Location:</span>
                          <span className="text-gray-600 ml-2">{service.description}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Introduction Message */}
                  {service.introduction_message && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 italic">
                        {service.introduction_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredServices.length === 0 && !loading && !error && (
              <div className="col-span-2 text-center py-12">
                <p className="text-gray-500">No services found matching your criteria</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerHome;
