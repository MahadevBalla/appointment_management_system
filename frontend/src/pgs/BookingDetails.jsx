import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, DollarSign, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const BookingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Get booking data from navigation state or sessionStorage
  const bookingData = location.state || JSON.parse(sessionStorage.getItem('bookingData') || '{}');
  const { appointment, resource, selectedDate, selectedTime, numberOfPeople } = bookingData;

  // Form state
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [serviceAnswers, setServiceAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Save booking data to sessionStorage on mount
  useEffect(() => {
    if (location.state) {
      sessionStorage.setItem('bookingData', JSON.stringify(location.state));
    }
  }, [location.state]);

  // Redirect if no booking data
  useEffect(() => {
    if (!appointment || !resource) {
      navigate('/customerhome');
    }
  }, [appointment, resource, navigate]);

  if (!appointment || !resource) {
    return null;
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
      if (question.required && !serviceAnswers[question.id]) {
        setError(`Please answer: ${question.question}`);
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
        resource: resource.id,
        date: selectedDate,
        time: selectedTime,
        number_of_people: numberOfPeople || 1,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        service_answers: serviceAnswers,
      };

      // API call to create booking
      const response = await fetch('/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(bookingPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const result = await response.json();
      
      // Clear session storage
      sessionStorage.removeItem('bookingData');
      
      // Navigate to success page
      navigate('/customer/booking-success', { state: { booking: result } });
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
      const paymentPayload = {
        service: appointment.id,
        resource: resource.id,
        date: selectedDate,
        time: selectedTime,
        number_of_people: numberOfPeople || 1,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        service_answers: serviceAnswers,
        amount: appointment.advance_payment_amount,
      };

      // API call to create payment order
      const response = await fetch('/api/payments/create-order/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const result = await response.json();
      
      // Redirect to payment gateway or handle payment
      // This will depend on your payment integration (Razorpay, Stripe, etc.)
      console.log('Payment order created:', result);
      
      // For now, navigate to payment page with order details
      navigate('/customer/payment', { state: { order: result, bookingData } });
    } catch (err) {
      setError(err.message || 'Failed to create payment order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderServiceQuestion = (question) => {
    switch (question.type) {
      case 'text':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id}>
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={question.id}
              type="text"
              value={serviceAnswers[question.id] || ''}
              onChange={(e) => handleServiceQuestionChange(question.id, e.target.value)}
              placeholder={`Enter ${question.question.toLowerCase()}`}
              required={question.required}
            />
          </div>
        );

      case 'number':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id}>
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={question.id}
              type="number"
              value={serviceAnswers[question.id] || ''}
              onChange={(e) => handleServiceQuestionChange(question.id, e.target.value)}
              placeholder={`Enter ${question.question.toLowerCase()}`}
              required={question.required}
            />
          </div>
        );

      case 'boolean':
        return (
          <div key={question.id} className="flex items-center space-x-2 py-2">
            <Checkbox
              id={question.id}
              checked={serviceAnswers[question.id] || false}
              onCheckedChange={(checked) => handleServiceQuestionChange(question.id, checked)}
            />
            <Label htmlFor={question.id} className="cursor-pointer">
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'textarea':
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id}>
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <textarea
              id={question.id}
              value={serviceAnswers[question.id] || ''}
              onChange={(e) => handleServiceQuestionChange(question.id, e.target.value)}
              placeholder={`Enter ${question.question.toLowerCase()}`}
              required={question.required}
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        );

      default:
        return (
          <div key={question.id} className="space-y-2">
            <Label htmlFor={question.id}>
              {question.question}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={question.id}
              type="text"
              value={serviceAnswers[question.id] || ''}
              onChange={(e) => handleServiceQuestionChange(question.id, e.target.value)}
              placeholder={`Enter ${question.question.toLowerCase()}`}
              required={question.required}
            />
          </div>
        );
    }
  };

  const isPaidService = appointment.advance_payment_required && appointment.advance_payment_amount > 0;

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
              {isPaidService ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-teal-50 rounded-md">
                    <span className="text-gray-700 font-medium">Amount to Pay:</span>
                    <span className="text-2xl font-bold text-teal-600">
                      ₹{appointment.advance_payment_amount}
                    </span>
                  </div>
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg"
                  >
                    {loading ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleConfirmBooking}
                  disabled={loading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg"
                >
                  {loading ? 'Confirming...' : 'Confirm Booking'}
                </Button>
              )}
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
                        ₹{appointment.advance_payment_amount}
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
