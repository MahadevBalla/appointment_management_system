import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

const CustomerHome = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Dummy appointments data
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      name: 'Dental care',
      picture: '/placeholder-dental.jpg',
      type: 'Paid',
      appointment_type: 'user',
      users: ['A1', 'A2'],
      location: "Doctor's office",
      introMessage: 'Schedule your visit today and experience expert dental care brought right to your doorstep.',
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
      ]
    },
    {
      id: 2,
      name: 'Tennis court',
      picture: '/placeholder-tennis.jpg',
      type: 'Free',
      appointment_type: 'resource',
      resources: ['R1', 'R2'],
      location: 'Tennis court',
      introMessage: 'Book your tennis court session and enjoy world-class facilities.',
      advance_payment_required: false,
      advance_payment_amount: 0,
      questions_schema: []
    },
  ]);

  // Redirect if not customer
  useEffect(() => {
    if (user && user.role !== 'customer') {
      navigate('/customerhome');
    }
  }, [user, navigate]);

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || apt.type === selectedType;
    return matchesSearch && matchesType;
  });

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

        {/* Appointments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/customer/appointment/${appointment.id}`)}
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
                        {appointment.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={
                          appointment.type === 'Paid'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                            : 'bg-green-50 text-green-700 border-green-300'
                        }
                      >
                        {appointment.type}
                      </Badge>
                    </div>

                    {appointment.users && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Users:</span>
                        <div className="flex gap-1 mt-1">
                          {appointment.users.map((user, idx) => (
                            <span key={idx} className="text-gray-600">{user}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {appointment.resources && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Resources:</span>
                        <div className="flex gap-1 mt-1">
                          {appointment.resources.map((resource, idx) => (
                            <span key={idx} className="text-gray-600">{resource}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Location:</span>
                      <span className="text-gray-600 ml-2">{appointment.location}</span>
                    </div>
                  </div>
                </div>

                {/* Introduction Message */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 italic">
                    {appointment.introMessage}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {filteredAppointments.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-gray-500">No appointments found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerHome;
