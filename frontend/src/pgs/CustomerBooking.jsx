import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@mantine/dates';
import { Calendar as CalendarIcon, Clock, Users } from 'lucide-react';
import '@mantine/dates/styles.css';

const CustomerBooking = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  // Get appointment and resource data safely
  const bookingInfo = useMemo(() => {
    // First try location.state
    if (location.state?.appointment && location.state?.resource) {
      return {
        appointment: location.state.appointment,
        resource: location.state.resource
      };
    }
    
    // Fallback to sessionStorage
    try {
      const stored = sessionStorage.getItem('bookingData');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.appointment && parsed.resource) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error parsing booking data:', error);
    }
    
    return null;
  }, [location.state]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [manageCapacity, setManageCapacity] = useState(false);

  // Available time slots
  const timeSlots = [
    { id: 1, time: '9:00 AM', available: true },
    { id: 2, time: '9:30 AM', available: true },
    { id: 3, time: '10:00 AM', available: false },
    { id: 4, time: '10:30 AM', available: true },
    { id: 5, time: '11:00 AM', available: true },
    { id: 6, time: '11:30 AM', available: true },
    { id: 7, time: '12:00 PM', available: false },
    { id: 8, time: '12:30 PM', available: true },
  ];

  // If no booking info, redirect back
  if (!bookingInfo) {
    return (
      <div className="w-full min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No booking information found</p>
          <Button onClick={() => navigate('/customer/home')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  const { appointment, resource } = bookingInfo;
  const showCapacityInput = appointment.resourceType !== 'user';

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null); // Reset slot when date changes
  };

  const handleSlotClick = (slot) => {
    if (slot.available) {
      setSelectedSlot(slot);
    }
  };

  const handleConfirmBooking = () => {
    const bookingData = {
      appointment,
      resource,
      selectedDate: selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate,
      selectedTime: selectedSlot?.time,
      numberOfPeople: (showCapacityInput && manageCapacity) ? numberOfPeople : 1,
    };
    
    // Save to sessionStorage as backup
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    // Navigate to booking details page
    navigate('/customer/booking-details', { state: bookingData });
  };

  const isBookingValid = selectedDate && selectedSlot;

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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/customer/appointment/${id}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Service Details
          </Button>
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Book Your Appointment
                </h1>
                <p className="text-teal-50">
                  {appointment.name} with {resource.name}
                </p>
              </div>
              <Badge className="bg-white text-teal-700 hover:bg-white">
                {appointment.type}
              </Badge>
            </div>
          </div>

          {/* Booking Form */}
          <div className="p-8">
            {/* Manage Capacity Toggle (for resources only) */}
            {showCapacityInput && (
              <div className="mb-8 pb-6 border-b border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manageCapacity}
                    onChange={(e) => setManageCapacity(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Manage Capacity</span>
                    <p className="text-xs text-gray-500">Enable to specify the number of people for this booking</p>
                  </div>
                </label>
              </div>
            )}

            {/* Step 1: Select Date */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-semibold text-gray-900">Step 1: Select Date</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 inline-block">
                <DatePicker
                  value={selectedDate}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  size="md"
                />
              </div>
            </div>

            {/* Step 2: Select Time Slot */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-teal-600" />
                <h2 className="text-lg font-semibold text-gray-900">Step 2: Select Time Slot</h2>
              </div>
              
              {!selectedDate ? (
                <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Please select a date first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleSlotClick(slot)}
                        disabled={!slot.available}
                        className={`
                          relative py-3 px-4 rounded-lg font-medium text-sm transition-all
                          ${
                            selectedSlot?.id === slot.id
                              ? 'bg-teal-600 text-white shadow-lg ring-2 ring-teal-500 ring-offset-2'
                              : slot.available
                              ? 'bg-white border-2 border-gray-300 text-gray-700 hover:border-teal-400 hover:bg-teal-50'
                              : 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                          }
                        `}
                      >
                        {slot.time}
                        {!slot.available && (
                          <span className="absolute top-1 right-1 text-xs">✕</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    Duration: {appointment.duration}
                  </p>
                </div>
              )}
            </div>

            {/* Step 3: Number of People (Conditional) */}
            {showCapacityInput && manageCapacity && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-teal-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Step 3: Number of People</h2>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                      How many people will be attending?
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max={resource.capacity ? parseInt(resource.capacity.split(' ')[0]) : 10}
                      value={numberOfPeople}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const maxCapacity = resource.capacity ? parseInt(resource.capacity.split(' ')[0]) : 10;
                        setNumberOfPeople(Math.min(Math.max(1, value), maxCapacity));
                      }}
                      className="w-24 text-center"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Maximum capacity: {resource.capacity || '10 people'}
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            {isBookingValid && (
              <div className="bg-teal-50 rounded-lg p-6 border border-teal-200 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium text-gray-900">{appointment.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{appointment.resourceType === 'user' ? 'Professional:' : 'Resource:'}</span>
                    <span className="font-medium text-gray-900">{resource.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {selectedDate instanceof Date 
                        ? selectedDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : new Date(selectedDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900">{selectedSlot.time}</span>
                  </div>
                  {showCapacityInput && manageCapacity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Number of People:</span>
                      <span className="font-medium text-gray-900">{numberOfPeople}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-teal-300">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-gray-900">{appointment.price}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(`/customer/appointment/${id}`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmBooking}
                disabled={!isBookingValid}
                className={`flex-1 font-semibold transition-all ${
                  isBookingValid
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-md'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isBookingValid ? 'Confirm Booking' : 'Select Date & Time to Continue'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerBooking;
