import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@mantine/dates';
import { Calendar as CalendarIcon, Clock, Users, RefreshCw } from 'lucide-react';
import '@mantine/dates/styles.css';
import { serviceAPI } from '../services/api';

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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate && id) {
      fetchAvailableSlots();
    }
  }, [selectedDate, id]);

  // Auto-refresh slots every 30 seconds when a date is selected
  useEffect(() => {
    if (!selectedDate || !id) return;

    const intervalId = setInterval(() => {
      console.log('Auto-refreshing slots...');
      fetchAvailableSlots();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [selectedDate, id]);

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      const dateStr = selectedDate instanceof Date 
        ? selectedDate.toISOString().split('T')[0] 
        : selectedDate;
      console.log('Fetching slots for service:', id, 'date:', dateStr);
      const response = await serviceAPI.getAvailability(id, dateStr);
      console.log('Slots response:', response.data);
      setAvailableSlots(response.data || []);
      setLastFetchTime(new Date());
    } catch (error) {
      console.error('Error fetching slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleRefreshSlots = () => {
    if (selectedDate && id) {
      fetchAvailableSlots();
    }
  };

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
    setSelectedSlot(slot);
  };

  const handleConfirmBooking = () => {
    // Get the time from the slot
    const slotTime = selectedSlot.start ? 
      new Date(selectedSlot.start).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }) : (selectedSlot.start_time || selectedSlot.time);

    const bookingData = {
      appointment,
      resource,
      selectedDate: selectedDate instanceof Date ? selectedDate.toISOString().split('T')[0] : selectedDate,
      selectedTime: slotTime,
      selectedSlot: selectedSlot,
      numberOfPeople: (showCapacityInput && manageCapacity) ? numberOfPeople : 1,
    };
    
    // Save to sessionStorage as backup
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
    
    // Navigate to booking details page
    navigate(`/customer/appointment/${id}/book/booking-details`, { state: bookingData });
  };

  const isBookingValid = selectedDate && selectedSlot;

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/customer/appointment/${id}`)}
            className="text-gray-600 hover:text-gray-900"
          >
            ←
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-teal-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Step 2: Select Time Slot</h2>
                </div>
                {selectedDate && (
                  <div className="flex items-center gap-3">
                    {lastFetchTime && (
                      <span className="text-xs text-gray-500">
                        Updated: {lastFetchTime.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshSlots}
                      disabled={loadingSlots}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className={`h-4 w-4 ${loadingSlots ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                )}
              </div>
              
              {!selectedDate ? (
                <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Please select a date first</p>
                </div>
              ) : loadingSlots ? (
                <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-spin" />
                  <p className="text-gray-500">Loading available slots...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 border-2 border-dashed border-gray-300 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No available slots for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    {availableSlots.map((slot) => {
                      // Parse the start datetime to display time
                      const startTime = slot.start ? 
                        new Date(slot.start).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : (slot.start_time || 'N/A');
                      
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleSlotClick(slot)}
                          className={`
                            relative py-3 px-4 rounded-lg font-medium text-sm transition-all
                            ${
                              selectedSlot?.id === slot.id
                                ? 'bg-teal-600 text-white shadow-lg ring-2 ring-teal-500 ring-offset-2'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-teal-400 hover:bg-teal-50'
                            }
                          `}
                        >
                          {startTime}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500">
                    Duration: {appointment.duration_minutes || appointment.duration} minutes
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
                    <span className="font-medium text-gray-900">
                      {selectedSlot.start ? 
                        new Date(selectedSlot.start).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        }) : (selectedSlot.start_time || selectedSlot.time)
                      }
                    </span>
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
