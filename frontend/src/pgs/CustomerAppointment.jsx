import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar as CalendarIcon, Clock, Users, Layers } from 'lucide-react';
import { serviceAPI } from '../services/api';

const CustomerAppointment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [service, setService] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch service details
  useEffect(() => {
    if (id) {
      fetchServiceDetails();
    }
  }, [id]);

  const fetchServiceDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await serviceAPI.getService(id);
      setService(response.data);
      
      // Initialize resources if they exist
      if (response.data.resources && response.data.resources.length > 0) {
        setResources(response.data.resources);
      }
    } catch (error) {
      console.error('Error fetching service:', error);
      setError('Failed to load service details. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  // Dummy appointment data for fallback
  const appointmentData = {
    1: {
      id: 1,
      name: 'Dental care',
      picture: '/placeholder-dental.jpg',
      type: 'Paid',
      appointment_type: 'user',
      price: '$50 per session',
      location: "Doctor's office - 123 Medical Center, Downtown",
      introMessage: 'Schedule your visit today and experience expert dental care brought right to your doorstep.',
      description: 'Professional dental care services including cleaning, checkups, and consultations. Our experienced dentists provide comprehensive care for all your dental needs.',
      duration: '45 minutes',
      availability: 'Monday - Friday, 9:00 AM - 5:00 PM',
      advance_payment_required: true,
      advance_payment_amount: 500,
      questions_schema: [
        {
          id: 'symptoms',
          question: 'Symptoms',
          type: 'textarea',
          required: true
        },
        {
          id: 'age',
          question: 'Age',
          type: 'number',
          required: true
        },
        {
          id: 'previousTreatment',
          question: 'Have you had dental treatment before?',
          type: 'boolean',
          required: false
        }
      ],
      resourceType: 'user',
      resources: [
        { 
          id: 'A1', 
          name: 'Dr. Harshil Shetty',
          specialization: 'General Dentistry',
          experience: '8 years',
          availability: 'Mon, Wed, Fri'
        },
        { 
          id: 'A2', 
          name: 'Dr. Vansh Sharma',
          specialization: 'Orthodontics',
          experience: '10 years',
          availability: 'Tue, Thu, Sat'
        },
      ],
    },
    2: {
      id: 2,
      name: 'Tennis court',
      picture: '/placeholder-tennis.jpg',
      type: 'Free',
      appointment_type: 'resource',
      price: 'Free',
      location: 'Tennis court - Sports Complex, West Wing',
      introMessage: 'Book your tennis court session and enjoy world-class facilities.',
      description: 'State-of-the-art tennis courts with professional-grade surfaces. Perfect for both casual players and serious athletes. Equipment rental available on-site.',
      duration: '60 minutes',
      availability: 'Daily, 6:00 AM - 10:00 PM',
      advance_payment_required: false,
      advance_payment_amount: 0,
      questions_schema: [],
      resourceType: 'resource',
      resources: [
        { 
          id: 'R1', 
          name: 'Court 1',
          surface: 'Hard Court',
          capacity: '4 players',
          features: 'Floodlights, Net'
        },
        { 
          id: 'R2', 
          name: 'Court 2',
          surface: 'Clay Court',
          capacity: '4 players',
          features: 'Covered, Premium Surface'
        },
      ],
    },
  };

  const appointment = service || appointmentData[id];

  // Loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading service details...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!appointment && !loading) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Service not found</p>
          <Button onClick={() => navigate('/customer/home')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleBookResource = (resource) => {
    setSelectedResource(resource);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/home')}
            className="text-gray-600 hover:text-gray-900"
          >
            ←
          </Button>
        </div>

        {/* Service Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex gap-8">
            {/* Picture */}
            <div className="w-64 h-64 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
              <span className="text-gray-400">Picture</span>
            </div>

            {/* Service Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {appointment.name}
                </h1>
                <Badge
                  variant="outline"
                  className={
                    appointment.advance_payment_required
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                      : 'bg-green-50 text-green-700 border-green-300'
                  }
                >
                  {appointment.advance_payment_required ? 'Paid' : 'Free'}
                  {appointment.price > 0 && ` - ₹${parseFloat(appointment.price).toFixed(2)}`}
                </Badge>
              </div>

              <p className="text-gray-600 italic">
                {appointment.introduction_message || appointment.introMessage}
              </p>

              <p className="text-gray-700">
                {appointment.description}
              </p>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Duration</div>
                    <div className="text-sm text-gray-600">{appointment.duration_minutes || appointment.duration} minutes</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Capacity</div>
                    <div className="text-sm text-gray-600">{appointment.capacity_per_slot || 1} per slot</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Resources Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Available {appointment.resource_type === 'user' ? 'Professionals' : 'Resources'}
          </h2>

          {resources.length === 0 ? (
            <p className="text-gray-600">No resources available for this service.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="border-2 border-gray-200 rounded-lg p-6 hover:border-teal-400 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {resource.name}
                        </h3>
                      </div>
                      {resource.email && (
                        <p className="text-sm text-gray-600">{resource.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Resource Details */}
                  <div className="space-y-2 mb-6">
                    {appointment.resource_type === 'user' ? (
                      <>
                        {resource.specialization && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Specialization:</span>
                            <span className="text-gray-600 ml-2">{resource.specialization}</span>
                          </div>
                        )}
                        {resource.experience && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Experience:</span>
                            <span className="text-gray-600 ml-2">{resource.experience}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {resource.description && (
                          <div className="text-sm text-gray-600">
                            {resource.description}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Book Button */}
                  <Button
                    onClick={() => navigate(`/customer/appointment/${id}/book`, { 
                      state: { 
                        appointment: appointment, 
                        resource: resource 
                      } 
                    })}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Book with {resource.name}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerAppointment;
