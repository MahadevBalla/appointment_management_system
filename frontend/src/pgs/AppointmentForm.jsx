import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Upload, 
  X, 
  Eye, 
  FileText, 
  Settings as SettingsIcon, 
  BarChart3,
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  User
} from 'lucide-react';
import { serviceAPI } from '../services/api';

const AppointmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: 'Dental care',
    duration: '00:30',
    location: "Doctor's Office",
    bookBy: 'user',
    assignment: 'automatically',
    manageCapacity: true,
    capacity: 1,
  });

  const [selectedUsers, setSelectedUsers] = useState(['A1 User 1', 'A2 User 2']);
  const [activeTab, setActiveTab] = useState('schedule');

  // Misc tab state
  const [miscData, setMiscData] = useState({
    introductionMessage: 'Schedule your visit today and experience expert dental care brought right to your doorstep.',
    confirmationMessage: 'Thank you for your trust we look forward to meeting you',
  });

  // Options tab state
  const [optionsData, setOptionsData] = useState({
    manualConfirmation: true,
    capacityPercentage: 50,
    paidBooking: true,
    bookingFees: 200,
    createSlotHours: 0.5,
    cancellationHours: 1,
  });

  // Answer type options for dialog
  const answerTypeOptions = [
    'Single line text',
    'Multi-line text',
    'Phone Number',
    'Radio (One Answer)',
    'Checkboxes (Multiple Answers)',
  ];

  // Answer type options for table dropdown
  const answerTypes = [
    'Single line text',
    'Multi line text',
    'Phone number',
    'Email',
    'Number',
    'Date',
    'Time',
    'Dropdown',
    'Checkbox',
    'Radio button',
  ];

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    answerType: 'Single line text',
    mandatory: false,
  });

  // Questions data - will be populated from API
  const [questions, setQuestions] = useState([]);

  // Slots data - will be populated from API
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [expandedBookings, setExpandedBookings] = useState({});

  // Dummy schedule data
  const [schedule, setSchedule] = useState([
    { id: 1, day: 'Monday', from: '9:00', to: '12:00' },
    { id: 2, day: 'Monday', from: '14:00', to: '17:00' },
    { id: 3, day: 'Tuesday', from: '9:00', to: '12:00' },
    { id: 4, day: 'Tuesday', from: '14:00', to: '17:00' },
    { id: 5, day: 'Wednesday', from: '9:00', to: '12:00' },
    { id: 6, day: 'Wednesday', from: '14:00', to: '17:00' },
    { id: 7, day: 'Thursday', from: '9:00', to: '12:00' },
    { id: 8, day: 'Thursday', from: '14:00', to: '17:00' },
    { id: 9, day: 'Friday', from: '9:00', to: '12:00' },
    { id: 10, day: 'Friday', from: '14:00', to: '17:00' },
  ]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Fetch service data when editing
  useEffect(() => {
    if (isEdit && id) {
      fetchServiceData();
    }
  }, [isEdit, id]);

  // Fetch slots when switching to schedule tab in edit mode
  useEffect(() => {
    if (isEdit && id && activeTab === 'schedule') {
      fetchSlots();
    }
  }, [isEdit, id, activeTab]);

  const fetchSlots = async () => {
    try {
      setLoadingSlots(true);
      const response = await serviceAPI.getServiceSlots(id);
      setSlots(response.data || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      // If admin endpoint fails (user might not be admin), just show empty
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchServiceData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await serviceAPI.getService(id);
      const service = response.data;

      // Populate form data
      setFormData({
        title: service.name || '',
        duration: formatDuration(service.duration_minutes) || '00:30',
        location: service.description || "Doctor's Office",
        bookBy: 'user',
        assignment: service.auto_assign_resource ? 'automatically' : 'manually',
        manageCapacity: true,
        capacity: service.capacity_per_slot || 1,
      });

      // Populate options data
      setOptionsData({
        manualConfirmation: service.manual_confirmation || false,
        capacityPercentage: 50,
        paidBooking: service.advance_payment_required || false,
        bookingFees: parseFloat(service.price) || 0,
        createSlotHours: 0.5,
        cancellationHours: 1,
      });

      // Convert questions_schema to questions format
      if (service.questions_schema && Array.isArray(service.questions_schema)) {
        const convertedQuestions = service.questions_schema.map((q, index) => ({
          id: index + 1,
          question: q.label,
          answerType: mapBackendTypeToFrontend(q.type),
          answer: '',
          mandatory: q.required,
          key: q.key,
        }));
        setQuestions(convertedQuestions);
      }

    } catch (error) {
      console.error('Error fetching service:', error);
      setError('Failed to load service data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to convert backend duration (minutes) to HH:MM format
  const formatDuration = (minutes) => {
    if (!minutes) return '00:30';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Helper to parse HH:MM to minutes
  const parseDuration = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  // Map backend question types to frontend answer types
  const mapBackendTypeToFrontend = (backendType) => {
    const typeMap = {
      'text': 'Single line text',
      'number': 'Number',
      'boolean': 'Checkbox',
    };
    return typeMap[backendType] || 'Single line text';
  };

  // Map frontend answer types to backend question types
  const mapFrontendTypeToBackend = (frontendType) => {
    const typeMap = {
      'Single line text': 'text',
      'Multi line text': 'text',
      'Phone number': 'text',
      'Email': 'text',
      'Number': 'number',
      'Checkbox': 'boolean',
      'Radio button': 'boolean',
    };
    return typeMap[frontendType] || 'text';
  };

  const handleAddScheduleLine = () => {
    const newId = schedule.length > 0 ? Math.max(...schedule.map(s => s.id)) + 1 : 1;
    setSchedule([...schedule, { id: newId, day: 'Monday', from: '9:00', to: '17:00' }]);
  };

  const handleDeleteSchedule = (id) => {
    setSchedule(schedule.filter(s => s.id !== id));
  };

  const handleUpdateSchedule = (id, field, value) => {
    setSchedule(schedule.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleAddQuestionClick = () => {
    setNewQuestion({
      question: '',
      answerType: 'Single line text',
      mandatory: false,
    });
    setDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!newQuestion.question.trim()) {
      return; // Don't save if question is empty
    }
    
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    
    // Generate key from question text (lowercase, underscored)
    const key = newQuestion.question.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    const questionData = {
      id: newId,
      question: newQuestion.question,
      answerType: newQuestion.answerType,
      answer: '',
      mandatory: newQuestion.mandatory,
      key: key,
    };

    // If in edit mode, save to backend immediately
    if (isEdit && id) {
      try {
        setLoading(true);
        setError('');
        
        const backendQuestion = {
          key: key,
          label: newQuestion.question,
          type: mapFrontendTypeToBackend(newQuestion.answerType),
          required: newQuestion.mandatory,
        };

        await serviceAPI.addQuestion(id, backendQuestion);
        
        // Add to local state after successful API call
        setQuestions([...questions, questionData]);
        setDialogOpen(false);
        setNewQuestion({
          question: '',
          answerType: 'Single line text',
          mandatory: false,
        });
      } catch (error) {
        console.error('Error adding question:', error);
        setError(error.response?.data?.error || 'Failed to add question. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      // For new services, just add to local state
      setQuestions([...questions, questionData]);
      setDialogOpen(false);
      setNewQuestion({
        question: '',
        answerType: 'Single line text',
        mandatory: false,
      });
    }
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleUpdateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const toggleUser = (user) => {
    if (selectedUsers.includes(user)) {
      setSelectedUsers(selectedUsers.filter(u => u !== user));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const toggleBookingDetails = (bookingId) => {
    setExpandedBookings(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  // Save handler to create or update service
  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Convert questions to backend questions_schema format
      const questions_schema = questions.map(q => ({
        key: q.key || q.question.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        label: q.question,
        type: mapFrontendTypeToBackend(q.answerType),
        required: q.mandatory,
      }));

      const serviceData = {
        name: formData.title,
        duration_minutes: parseDuration(formData.duration),
        description: formData.location,
        capacity_per_slot: formData.capacity,
        auto_assign_resource: formData.assignment === 'automatically',
        manual_confirmation: optionsData.manualConfirmation,
        advance_payment_required: optionsData.paidBooking,
        price: optionsData.bookingFees.toString(),
        questions_schema: questions_schema,
        is_published: true,
      };

      if (isEdit) {
        await serviceAPI.updateService(id, serviceData);
      } else {
        await serviceAPI.createService(serviceData);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving service:', error);
      setError(error.response?.data?.error || 'Failed to save service. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading service data...</div>
      </div>
    );
  }

  // Render appropriate input based on answer type
  const renderAnswerInput = (question) => {
    const { id, answerType, answer } = question;

    switch (answerType) {
      case 'Single line text':
      case 'Email':
        return (
          <Input
            type={answerType === 'Email' ? 'email' : 'text'}
            value={answer}
            onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
            placeholder={answerType === 'Email' ? 'email@example.com' : 'Enter answer'}
            className="w-full"
          />
        );

      case 'Multi line text':
        return (
          <textarea
            value={answer}
            onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
            placeholder="Enter answer"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        );

      case 'Phone number':
        return (
          <Input
            type="tel"
            value={answer}
            onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full"
          />
        );

      case 'Number':
        return (
          <Input
            type="number"
            value={answer}
            onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
            placeholder="Enter number"
            className="w-full"
          />
        );

      case 'Date':
        return (
          <Input
            type="date"
            value={answer}
            onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
            className="w-full"
          />
        );

      case 'Time':
        return (
          <Input
            type="time"
            value={answer}
            onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
            className="w-full"
          />
        );

      case 'Dropdown':
        return (
          <div className="space-y-1">
            <Input
              value={answer}
              onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
              placeholder="Option1, Option2, Option3"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Comma-separated options</p>
          </div>
        );

      case 'Checkbox':
        return (
          <div className="space-y-1">
            <Input
              value={answer}
              onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
              placeholder="Option1, Option2, Option3"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Comma-separated options</p>
          </div>
        );

      case 'Radio button':
        return (
          <div className="space-y-1">
            <Input
              value={answer}
              onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
              placeholder="Option1, Option2, Option3"
              className="w-full"
            />
            <p className="text-xs text-gray-500">Comma-separated options</p>
          </div>
        );

      default:
        return (
          <Input
            value={answer}
            onChange={(e) => handleUpdateQuestion(id, 'answer', e.target.value)}
            placeholder="Enter answer"
            className="w-full"
          />
        );
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src="/logo-white.png" alt="Logo" className="h-8 w-8" />
                <span className="text-xl font-bold text-teal-600">NeoDermaScan</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/reporting')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Reporting
              </Button>
              
              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <SettingsIcon className="h-4 w-4" />
                    Settings
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/settings/users')}>
                    Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings/resources')}>
                    Resources
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/meetings')}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Meetings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
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

        {/* Action Buttons */}
        <div className="mb-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/admindashboard/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
          <Button
            variant="outline"
            onClick={() => {/* Preview functionality */}}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {loading ? 'Saving...' : (isEdit ? 'Update' : 'Publish')}
          </Button>
        </div>

        {/* Appointment Details Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Appointment Title */}
              <div>
                <Label htmlFor="title" className="mb-2 block">Appointment title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Dental care"
                  className="w-full"
                />
              </div>

              {/* Duration and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="mb-2 block">Duration</Label>
                  <Input
                    id="duration"
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="00:30 Hours"
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="mb-2 block">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Doctor's Office"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    IF Location is not set, consider it an Online Appointment
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Picture */}
            <div>
              <Label className="mb-2 block">Picture</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center h-48">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <Button variant="outline" size="sm" className="mb-2">
                  Upload
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600">
                  <X className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Booking and Assignment Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="space-y-6">
            {/* Book By */}
            <div>
              <Label className="mb-3 block">Book By</Label>
              <RadioGroup
                value={formData.bookBy}
                onValueChange={(value) => setFormData({ ...formData, bookBy: value })}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="user" id="book-user" />
                  <Label htmlFor="book-user">User</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="resources" id="book-resources" />
                  <Label htmlFor="book-resources">Resources</Label>
                </div>
              </RadioGroup>

              {/* User Selection */}
              {formData.bookBy === 'user' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {['A1 User 1', 'A2 User 2'].map((user) => (
                    <Button
                      key={user}
                      variant={selectedUsers.includes(user) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleUser(user)}
                    >
                      {user}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Assignment */}
            <div>
              <Label className="mb-3 block">Assignment</Label>
              <RadioGroup
                value={formData.assignment}
                onValueChange={(value) => setFormData({ ...formData, assignment: value })}
                className="flex gap-6"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="automatically" id="assign-auto" />
                  <Label htmlFor="assign-auto">Automatically</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="by-visitor" id="assign-visitor" />
                  <Label htmlFor="assign-visitor">By visitor</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Manage Capacity */}
            <div className="flex items-center gap-3">
              <Checkbox
                id="manage-capacity"
                checked={formData.manageCapacity}
                onChange={(e) => setFormData({ ...formData, manageCapacity: e.target.checked })}
              />
              <div className="flex-1">
                <Label htmlFor="manage-capacity" className="cursor-pointer">
                  Manage capacity
                </Label>
                {formData.manageCapacity && (
                  <div className="mt-2">
                    <Input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                      className="w-20 inline-block mr-2"
                      min="1"
                    />
                    <span className="text-sm text-gray-600">
                      Simultaneous Appointment(s) per user
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Interface */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 px-6">
              <TabsList className="bg-transparent h-auto p-0">
                <TabsTrigger value="schedule" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Schedule
                </TabsTrigger>
                <TabsTrigger value="question" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Question
                </TabsTrigger>
                <TabsTrigger value="options" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  options
                </TabsTrigger>
                <TabsTrigger value="misc" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                  Misc
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="schedule" className="mt-0">
                <div className="space-y-4">
                  {isEdit ? (
                    // Show slots with bookings for existing services
                    loadingSlots ? (
                      <div className="text-center py-8 text-gray-500">Loading slots...</div>
                    ) : slots.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Service Slots & Bookings</h3>
                          <Button variant="outline" size="sm" onClick={fetchSlots}>
                            Refresh
                          </Button>
                        </div>
                        {slots.map((slot) => (
                          <div key={slot.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">
                                    {new Date(slot.start_datetime).toLocaleString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-gray-600">
                                    {new Date(slot.end_datetime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-600">
                                  Capacity: {slot.booked_count} / {slot.capacity}
                                </span>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  slot.booked_count >= slot.capacity
                                    ? 'bg-red-100 text-red-700'
                                    : slot.booked_count > 0
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                  {slot.booked_count >= slot.capacity ? 'Full' : slot.booked_count > 0 ? 'Partial' : 'Available'}
                                </span>
                              </div>
                            </div>
                            
                            {slot.bookings && slot.bookings.length > 0 && (
                              <div className="mt-3 border-t border-gray-200 pt-3">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Bookings ({slot.bookings.length})</h4>
                                <div className="space-y-2">
                                  {slot.bookings.map((booking) => (
                                    <div key={booking.booking_id} className="border border-gray-200 rounded-lg overflow-hidden">
                                      <div 
                                        className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                                        onClick={() => toggleBookingDetails(booking.booking_id)}
                                      >
                                        <div className="flex items-center gap-4 flex-1">
                                          <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-500" />
                                            <span className="font-medium">{booking.customer_name}</span>
                                          </div>
                                          <span className="text-sm text-gray-600">Qty: {booking.quantity}</span>
                                          <span className={`px-2 py-1 text-xs rounded-full ${
                                            booking.status === 'confirmed'
                                              ? 'bg-green-100 text-green-700'
                                              : booking.status === 'pending'
                                              ? 'bg-yellow-100 text-yellow-700'
                                              : booking.status === 'cancelled'
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-blue-100 text-blue-700'
                                          }`}>
                                            {booking.status}
                                          </span>
                                        </div>
                                        {expandedBookings[booking.booking_id] ? (
                                          <ChevronUp className="h-4 w-4 text-gray-500" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-gray-500" />
                                        )}
                                      </div>
                                      
                                      {expandedBookings[booking.booking_id] && (
                                        <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="flex items-center gap-2 text-sm">
                                              <Mail className="h-4 w-4 text-gray-400" />
                                              <span className="text-gray-600">Email:</span>
                                              <span className="font-medium">{booking.customer_email}</span>
                                            </div>
                                            {booking.customer_phone && (
                                              <div className="flex items-center gap-2 text-sm">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span className="text-gray-600">Phone:</span>
                                                <span className="font-medium">{booking.customer_phone}</span>
                                              </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm">
                                              <Clock className="h-4 w-4 text-gray-400" />
                                              <span className="text-gray-600">Booked:</span>
                                              <span className="font-medium">
                                                {new Date(booking.created_at).toLocaleString('en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric',
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                              <FileText className="h-4 w-4 text-gray-400" />
                                              <span className="text-gray-600">ID:</span>
                                              <span className="font-mono text-xs text-gray-500">
                                                {booking.booking_id.substring(0, 13)}...
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {booking.answers && Object.keys(booking.answers).length > 0 && (
                                            <div className="pt-3 border-t border-gray-100">
                                              <h5 className="text-sm font-semibold text-gray-700 mb-2">Customer Responses</h5>
                                              <div className="space-y-2">
                                                {Object.entries(booking.answers).map(([key, value]) => (
                                                  <div key={key} className="text-sm">
                                                    <span className="text-gray-600 font-medium">{key}:</span>
                                                    <span className="ml-2 text-gray-800">{String(value)}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No slots found for this service.
                      </div>
                    )
                  ) : (
                    // Show schedule editor for new services
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Every</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schedule.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <select
                                  value={item.day}
                                  onChange={(e) => handleUpdateSchedule(item.id, 'day', e.target.value)}
                                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                                >
                                  {daysOfWeek.map((day) => (
                                    <option key={day} value={day}>{day}</option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    value={item.from}
                                    onChange={(e) => handleUpdateSchedule(item.id, 'from', e.target.value)}
                                    className="w-32"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    value={item.to}
                                    onChange={(e) => handleUpdateSchedule(item.id, 'to', e.target.value)}
                                    className="w-32"
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSchedule(item.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <Button
                        variant="ghost"
                        onClick={handleAddScheduleLine}
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add a Line
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="question" className="mt-0">
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Question</TableHead>
                        <TableHead className="w-[200px]">Answer type</TableHead>
                        <TableHead>Answer</TableHead>
                        <TableHead className="w-[120px]">mandatory</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {questions.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Input
                              value={item.question}
                              onChange={(e) => handleUpdateQuestion(item.id, 'question', e.target.value)}
                              placeholder="Enter question"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <select
                              value={item.answerType}
                              onChange={(e) => handleUpdateQuestion(item.id, 'answerType', e.target.value)}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                            >
                              {answerTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            {renderAnswerInput(item)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Checkbox
                                checked={item.mandatory}
                                onChange={(e) => handleUpdateQuestion(item.id, 'mandatory', e.target.checked)}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Add Question Row */}
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Button
                            variant="ghost"
                            onClick={handleAddQuestionClick}
                            className="text-teal-600 hover:text-teal-700 w-full justify-start"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add a question
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Add Question Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent className="sm:max-w-[600px] bg-white relative">
                    <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                      <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                      <span className="sr-only">Close</span>
                    </DialogClose>
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-gray-900 mb-2 pr-8">
                        Add a question
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-2">
                      {/* Answer Type Buttons */}
                      <div>
                        <Label className="mb-3 block text-sm font-semibold text-gray-700">
                          Answer Type
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {answerTypeOptions.map((type) => (
                            <Button
                              key={type}
                              type="button"
                              variant={newQuestion.answerType === type ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setNewQuestion({ ...newQuestion, answerType: type })}
                              className={
                                newQuestion.answerType === type
                                  ? 'bg-teal-600 text-white hover:bg-teal-700 border-teal-600 shadow-md'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                              }
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Question Input */}
                      <div className="space-y-2">
                        <Label htmlFor="dialog-question" className="text-sm font-semibold text-gray-700">
                          Question
                        </Label>
                        <Input
                          id="dialog-question"
                          value={newQuestion.question}
                          onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                          placeholder="Anything else we should know?"
                          className="w-full border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                        />
                      </div>

                      {/* Mandatory Checkbox */}
                      <div className="flex items-center gap-3 pt-2">
                        <Checkbox
                          id="dialog-mandatory"
                          checked={newQuestion.mandatory}
                          onChange={(e) => setNewQuestion({ ...newQuestion, mandatory: e.target.checked })}
                          className="h-4 w-4 border-gray-300"
                        />
                        <Label htmlFor="dialog-mandatory" className="cursor-pointer text-sm font-medium text-gray-700">
                          Mandatory Answer
                        </Label>
                      </div>
                    </div>

                    <DialogFooter className="mt-6 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveQuestion}
                        className="bg-teal-600 text-white hover:bg-teal-700"
                      >
                        Add Question
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              <TabsContent value="options" className="mt-0">
                <div className="space-y-6">
                  {/* Manual Confirmation */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="manual-confirmation"
                      checked={optionsData.manualConfirmation}
                      onCheckedChange={(checked) => setOptionsData({ ...optionsData, manualConfirmation: checked })}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="manual-confirmation" className="cursor-pointer text-sm font-semibold text-gray-700">
                        Manual confirmation
                      </Label>
                      {optionsData.manualConfirmation && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Upto</span>
                          <Input
                            type="number"
                            value={optionsData.capacityPercentage}
                            onChange={(e) => setOptionsData({ ...optionsData, capacityPercentage: parseInt(e.target.value) || 0 })}
                            className="w-20 text-center"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm text-gray-600">% of capacity</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Paid Booking */}
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="paid-booking"
                      checked={optionsData.paidBooking}
                      onCheckedChange={(checked) => setOptionsData({ ...optionsData, paidBooking: checked })}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="paid-booking" className="cursor-pointer text-sm font-semibold text-gray-700">
                        Paid Booking
                      </Label>
                      {optionsData.paidBooking && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Booking Fees (Rs</span>
                          <Input
                            type="number"
                            value={optionsData.bookingFees}
                            onChange={(e) => setOptionsData({ ...optionsData, bookingFees: parseInt(e.target.value) || 0 })}
                            className="w-24 text-center"
                            min="0"
                          />
                          <span className="text-sm text-gray-600">Per booking)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                    {/* Create Slot */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Create Slot
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.5"
                          value={optionsData.createSlotHours}
                          onChange={(e) => setOptionsData({ ...optionsData, createSlotHours: parseFloat(e.target.value) || 0 })}
                          className="w-24"
                          min="0"
                        />
                        <span className="text-sm text-gray-600">hours</span>
                      </div>
                    </div>

                    {/* Cancellation */}
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">
                        Cancellation
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">up to</span>
                        <Input
                          type="number"
                          step="0.5"
                          value={optionsData.cancellationHours}
                          onChange={(e) => setOptionsData({ ...optionsData, cancellationHours: parseFloat(e.target.value) || 0 })}
                          className="w-24"
                          min="0"
                        />
                        <span className="text-sm text-gray-600">hour(s) before the booking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="misc" className="mt-0">
                <div className="space-y-6">
                  {/* Introduction Page Message */}
                  <div className="space-y-3">
                    <Label htmlFor="intro-message" className="text-sm font-semibold text-gray-700">
                      Introduction page message
                    </Label>
                    <textarea
                      id="intro-message"
                      value={miscData.introductionMessage}
                      onChange={(e) => setMiscData({ ...miscData, introductionMessage: e.target.value })}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter introduction message..."
                    />
                  </div>

                  {/* Confirmation Page Message */}
                  <div className="space-y-3">
                    <Label htmlFor="confirmation-message" className="text-sm font-semibold text-gray-700">
                      Confirmation page message
                    </Label>
                    <textarea
                      id="confirmation-message"
                      value={miscData.confirmationMessage}
                      onChange={(e) => setMiscData({ ...miscData, confirmationMessage: e.target.value })}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter confirmation message..."
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AppointmentForm;

