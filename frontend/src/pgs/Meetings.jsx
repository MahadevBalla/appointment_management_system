import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import {
  Settings as SettingsIcon,
  BarChart3,
  Calendar,
  X,
  ChevronDown
} from 'lucide-react';

const Meetings = () => {
  const navigate = useNavigate();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('Dental care');

  // Dummy meetings data
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      subject: 'Cavity',
      appointment: 'Dental care',
      appointmentType: 'resource', // 'user' or 'resource'
      bookedBy: 'Vipin',
      resource: '', // Only for resource type
      start: 'Dec 12 4:00',
      end: 'Dec 12 4:30',
      capacity: '', // Only for resource type
      status: 'Booked',
    },
    {
      id: 2,
      subject: 'Routine',
      appointment: 'Dental care',
      appointmentType: 'resource', // 'user' or 'resource'
      bookedBy: 'Mayur',
      resource: '', // Only for resource type
      start: 'Dec 15 4:00',
      end: 'Dec 15 4:30',
      capacity: '', // Only for resource type
      status: 'Request',
    },
  ]);

  // Status options for dropdown
  const statusOptions = ['Booked', 'Request', 'Cancelled'];

  const handleStatusChange = (meetingId, newStatus) => {
    setMeetings(meetings.map(meeting =>
      meeting.id === meetingId ? { ...meeting, status: newStatus } : meeting
    ));
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Check if any meeting is of resource type
  const hasResourceType = meetings.some(m => m.appointmentType === 'resource');

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Booked':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Request':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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
                <span className="text-xl font-bold text-teal-600">Bookify</span>
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
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
        </div>

        {/* Search Filter */}
        <div className="mb-6">
          <div className="relative w-64">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by appointment..."
              className="pr-8"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Meetings Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Appointment</TableHead>
                <TableHead>Booked by</TableHead>
                {hasResourceType && <TableHead>Resource</TableHead>}
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                {hasResourceType && <TableHead>Capacity</TableHead>}
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings
                .filter(meeting =>
                  !searchQuery || meeting.appointment.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((meeting) => (
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.subject}</TableCell>
                    <TableCell>{meeting.appointment}</TableCell>
                    <TableCell>{meeting.bookedBy}</TableCell>
                    {hasResourceType && (
                      <TableCell>
                        {meeting.appointmentType === 'resource' ? meeting.resource || '-' : '-'}
                      </TableCell>
                    )}
                    <TableCell>{meeting.start}</TableCell>
                    <TableCell>{meeting.end}</TableCell>
                    {hasResourceType && (
                      <TableCell>
                        {meeting.appointmentType === 'resource' ? meeting.capacity || '-' : '-'}
                      </TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`min-w-[100px] justify-between ${getStatusColor(meeting.status)}`}
                          >
                            {meeting.status}
                            <ChevronDown className="h-3 w-3 ml-2" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-32">
                          {statusOptions.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => handleStatusChange(meeting.id, status)}
                            >
                              {status}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              {meetings.filter(meeting =>
                !searchQuery || meeting.appointment.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={hasResourceType ? 8 : 6}
                      className="text-center py-8 text-gray-500"
                    >
                      No meetings found
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Meetings;
