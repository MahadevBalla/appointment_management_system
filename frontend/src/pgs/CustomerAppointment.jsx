import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Clock, Users, Layers } from 'lucide-react';

const CustomerAppointment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [selectedResource, setSelectedResource] = useState(null);

  // Dummy appointment data - will be fetched from backend
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

  const appointment = appointmentData[id];

  // Redirect if not customer
  useEffect(() => {
    if (user && user.role !== 'customer') {
      navigate('/customerhome');
    }
  }, [user, navigate]);

  if (!appointment) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Appointment not found</p>
          <Button onClick={() => navigate('/customer/home')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleBookResource = (resource) => {
    // Store in sessionStorage as backup
    sessionStorage.setItem('bookingData', JSON.stringify({
      appointment,
      resource
    }));
    
    // Navigate to booking/schedule selection page
    navigate(`/customer/appointment/${id}/book`, { 
      state: { 
        appointment: appointment,
        resource: resource 
      } 
    });
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Customer Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo-white.png" alt="Logo" className="h-8 w-8" />
              <span className="text-xl font-bold text-teal-600">NeoDermaScan</span>
            </div>
            <nav className="flex items-center gap-6">
              <button
                onClick={() => navigate('/customer/home')}
                className="text-gray-700 hover:text-teal-600 transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/about')}
                className="text-gray-700 hover:text-teal-600 transition-colors"
              >
                About
              </button>
              <span className="text-sm text-gray-700">Welcome, {user?.full_name || 'Customer 1'}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/customer/profile')}
              >
                My Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('authTokens');
                  sessionStorage.removeItem('authTokens');
                  window.location.href = '/login';
                }}
                className="text-red-600 hover:text-red-700"
              >
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/customer/home')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Appointments
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
                    appointment.type === 'Paid'
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                      : 'bg-green-50 text-green-700 border-green-300'
                  }
                >
                  {appointment.type} - {appointment.price}
                </Badge>
              </div>

              <p className="text-gray-600 italic">
                {appointment.introMessage}
              </p>

              <p className="text-gray-700">
                {appointment.description}
              </p>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Location</div>
                    <div className="text-sm text-gray-600">{appointment.location}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Duration</div>
                    <div className="text-sm text-gray-600">{appointment.duration}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-teal-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Availability</div>
                    <div className="text-sm text-gray-600">{appointment.availability}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  {appointment.resourceType === 'user' ? (
                    <Users className="h-5 w-5 text-teal-600 mt-0.5" />
                  ) : (
                    <Layers className="h-5 w-5 text-teal-600 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">Type</div>
                    <div className="text-sm text-gray-600">
                      {appointment.resourceType === 'user' ? 'Professional Service' : 'Resource Booking'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Resources Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Available {appointment.resourceType === 'user' ? 'Professionals' : 'Resources'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appointment.resources.map((resource) => (
              <div
                key={resource.id}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-teal-400 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-teal-600">
                        {resource.id}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {resource.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Resource Details */}
                <div className="space-y-2 mb-6">
                  {appointment.resourceType === 'user' ? (
                    <>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Specialization:</span>
                        <span className="text-gray-600 ml-2">{resource.specialization}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Experience:</span>
                        <span className="text-gray-600 ml-2">{resource.experience}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Available:</span>
                        <span className="text-gray-600 ml-2">{resource.availability}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Surface:</span>
                        <span className="text-gray-600 ml-2">{resource.surface}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Capacity:</span>
                        <span className="text-gray-600 ml-2">{resource.capacity}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Features:</span>
                        <span className="text-gray-600 ml-2">{resource.features}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Book Button */}
                <Button
                  onClick={() => handleBookResource(resource)}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  Book {resource.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerAppointment;
