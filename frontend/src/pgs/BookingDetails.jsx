import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, DollarSign, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { serviceAPI } from '../services/api';

const BookingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);

  // Helper function to get auth token from authTokens object
  const getAuthToken = () => {
    const tokens = localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : sessionStorage.getItem("authTokens")
        ? JSON.parse(sessionStorage.getItem("authTokens"))
        : null;
    return tokens?.access || null;
  };

  // Get booking data from navigation state or sessionStorage
  const bookingData = location.state || JSON.parse(sessionStorage.getItem('bookingData') || '{}');
  const { resource, selectedDate, selectedTime, numberOfPeople, selectedSlot } = bookingData;

  // State for fresh service data
  const [appointment, setAppointment] = useState(bookingData.appointment || null);
  const [fetchingService, setFetchingService] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [serviceAnswers, setServiceAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch fresh service data on mount to get latest questions_schema
  useEffect(() => {
    const fetchServiceData = async () => {
      if (id) {
        try {
          setFetchingService(true);
          const response = await serviceAPI.getService(id);
          setAppointment(response.data);

          // Update sessionStorage with fresh data
          const updatedBookingData = {
            ...bookingData,
            appointment: response.data
          };
          sessionStorage.setItem('bookingData', JSON.stringify(updatedBookingData));
        } catch (error) {
          console.error('Error fetching service:', error);
        } finally {
          setFetchingService(false);
        }
      }
    };

    fetchServiceData();
  }, [id]);

  // Save booking data to sessionStorage on mount
  useEffect(() => {
    if (location.state) {
      sessionStorage.setItem('bookingData', JSON.stringify(location.state));
    }
  }, [location.state]);

  // Redirect if no booking data (but not during payment flow)
  useEffect(() => {
    if (!resource && !loading) {
      navigate('/customer/home');
    }
  }, [resource, navigate, loading]);

  if (!appointment || !resource) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            {fetchingService ? 'Loading booking details...' : 'No booking information found'}
          </p>
          {!fetchingService && (
            <Button onClick={() => navigate('/customer/home')}>
              Return to Home
            </Button>
          )}
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceQuestionChange = (questionId, value) => {
    setServiceAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateForm = () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      setError('Please fill in all required customer details');
      return false;
    }

    // Validate service questions
    const questions = appointment.questions_schema || [];
    for (const question of questions) {
      const questionKey = question.key || question.id;
      const questionText = question.label || question.question || 'Question';

      if (question.required && !serviceAnswers[questionKey]) {
        setError(`Please answer: ${questionText}`);
        return false;
      }
    }

    return true;
  };

  const handleConfirmBooking = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const bookingPayload = {
        service: appointment.id,
        slot: selectedSlot.id,
        resource: resource.id || null,
        answers: serviceAnswers,
        quantity: numberOfPeople || 1,
      };

      console.log('Booking payload:', bookingPayload);

      // API call to create booking
      const response = await fetch('http://localhost:8000/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(bookingPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Booking error response:', errorData);

        // Handle array of errors or single error message
        const errorMessage = Array.isArray(errorData)
          ? errorData.join(', ')
          : errorData.error || errorData.message || JSON.stringify(errorData);

        throw new Error(errorMessage || 'Failed to create booking');
      }

      const result = await response.json();

      // Clear session storage
      sessionStorage.removeItem('bookingData');

      // Navigate to success page
      navigate(`/customer/${result.id}/success`, { state: { booking_id: result.id } });
    } catch (err) {
      setError(err.message || 'Failed to confirm booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // First, create the booking
      const bookingPayload = {
        service: appointment.id,
        slot: selectedSlot.id,
        resource: resource.id || null,
        answers: serviceAnswers,
        quantity: numberOfPeople || 1,
      };

      const bookingResponse = await fetch('http://localhost:8000/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify(bookingPayload)
      });

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();

        // Handle array of errors or single error message
        const errorMessage = Array.isArray(errorData)
          ? errorData.join(', ')
          : errorData.error || errorData.message || JSON.stringify(errorData);

        throw new Error(errorMessage || 'Failed to create booking');
      }

      const bookingResult = await bookingResponse.json();

      // Create Razorpay order
      const orderResponse = await fetch('http://localhost:8000/api/payments/create-order/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ booking_id: bookingResult.id }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      // Function to open Razorpay
      const openRazorpay = () => {
        const options = {
          key: orderData.razorpay_key,
          amount: orderData.amount,
          currency: orderData.currency,
          order_id: orderData.order_id,
          name: appointment.name,
          description: `Booking for ${appointment.name}`,
          handler: async function (response) {
            // Verify payment
            try {
              console.log('Payment response from Razorpay:', response);
              
              const verifyResponse = await fetch('http://localhost:8000/api/payments/verify/', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                }),
              });

              const verifyData = await verifyResponse.json();
              console.log('Verification response:', verifyData);

              if (!verifyResponse.ok) {
                const errorMessage = verifyData.error || 'Payment verification failed';
                throw new Error(errorMessage);
              }

              // Clear session storage
              sessionStorage.removeItem('bookingData');

              // Navigate to success page
              navigate(`/customer/${bookingResult.id}/success`, {
                state: {
                  booking_id: bookingResult.id
                }
              });
            } catch (verifyError) {
              console.error('Verification error:', verifyError);
              setError(verifyError.message || 'Payment verification failed. Please contact support.');
              setLoading(false);
            }
          },
          theme: {
            color: '#14b8a6' // Teal color
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              setError('Payment cancelled');
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setLoading(false);
      };

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          openRazorpay();
        };
        script.onerror = () => {
          setError('Failed to load payment gateway. Please refresh and try again.');
          setLoading(false);
        };
        document.body.appendChild(script);
      } else {
        openRazorpay();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to process payment. Please try again.');
      setLoading(false);
    }
  };

  const renderServiceQuestion = (question) => {
    const questionText = question.label || question.question || 'Question';
    const questionKey = question.key || question.id;

    switch (question.type) {
      case 'text':
        return (
          <div key={questionKey} className="space-y-2">
            <Label htmlFor={questionKey}>
              {questionText}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={questionKey}
              type="text"
              value={serviceAnswers[questionKey] || ''}
              onChange={(e) => handleServiceQuestionChange(questionKey, e.target.value)}
              placeholder={`Enter ${questionText.toLowerCase()}`}
              required={question.required}
            />
          </div>
        );

      case 'number':
        return (
          <div key={questionKey} className="space-y-2">
            <Label htmlFor={questionKey}>
              {questionText}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={questionKey}
              type="number"
              value={serviceAnswers[questionKey] || ''}
              onChange={(e) => handleServiceQuestionChange(questionKey, e.target.value)}
              placeholder={`Enter ${questionText.toLowerCase()}`}
              required={question.required}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={questionKey} className="flex items-center space-x-2 py-2">
            <Checkbox
              id={questionKey}
              checked={serviceAnswers[questionKey] || false}
              onCheckedChange={(checked) => handleServiceQuestionChange(questionKey, checked)}
            />
            <Label htmlFor={questionKey} className="cursor-pointer">
              {questionText}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'textarea':
        return (
          <div key={questionKey} className="space-y-2">
            <Label htmlFor={questionKey}>
              {questionText}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <textarea
              id={questionKey}
              value={serviceAnswers[questionKey] || ''}
              onChange={(e) => handleServiceQuestionChange(questionKey, e.target.value)}
              placeholder={`Enter ${questionText.toLowerCase()}`}
              required={question.required}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        );

      default:
        return (
          <div key={questionKey} className="space-y-2">
            <Label htmlFor={questionKey}>
              {questionText}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={questionKey}
              type="text"
              value={serviceAnswers[questionKey] || ''}
              onChange={(e) => handleServiceQuestionChange(questionKey, e.target.value)}
              placeholder={`Enter ${questionText.toLowerCase()}`}
              required={question.required}
            />
          </div>
        );
    }
  };

  const isPaidService = appointment.advance_payment_required && appointment.price > 0;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Booking Details</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Customer Details Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Service Questions Section */}
            {appointment.questions_schema && appointment.questions_schema.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
                <div className="space-y-4">
                  {appointment.questions_schema.map(question => renderServiceQuestion(question))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <Button
                onClick={isPaidService ? handleProceedToPayment : handleConfirmBooking}
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg"
              >
                {loading
                  ? (isPaidService ? 'Processing...' : 'Confirming...')
                  : (isPaidService ? 'Proceed to Payment' : 'Confirm Booking')
                }
              </Button>
            </div>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Service</p>
                  <p className="font-semibold text-gray-900">{appointment.name}</p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-1">
                    {appointment.appointment_type === 'resource' ? 'Resource' : 'Professional'}
                  </p>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{resource.name}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">
                        {new Date(selectedDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{selectedTime}</p>
                    </div>
                  </div>
                </div>

                {numberOfPeople && numberOfPeople > 1 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm text-gray-500 mb-1">Number of People</p>
                    <p className="font-medium text-gray-900">{numberOfPeople}</p>
                  </div>
                )}

                {isPaidService && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Payment Required</p>
                      <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                        Advance Payment
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <p className="text-xl font-bold text-teal-600">
                        ₹{appointment.price}
                      </p>
                    </div>
                  </div>
                )}

                {!isPaidService && (
                  <div className="border-t border-gray-200 pt-4">
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      Free Service
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingDetails;
