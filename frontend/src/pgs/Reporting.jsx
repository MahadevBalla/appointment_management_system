import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  Settings as SettingsIcon, 
  BarChart3,
  Calendar
} from 'lucide-react';

const Reporting = () => {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState('Appointmanrts');

  // Dummy appointments data
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      name: 'Vipin jindal',
      time: 'Dec 12 4:00',
      resource: '',
      answers: '+919874654632',
      selected: false,
    },
    {
      id: 2,
      name: 'Tarak gor',
      time: 'Dec 13 9:00',
      resource: 'Court 1',
      answers: '+914787998465',
      selected: false,
    },
  ]);

  const handleSelectAll = (checked) => {
    setAppointments(appointments.map(apt => ({ ...apt, selected: checked })));
  };

  const handleSelectAppointment = (id, checked) => {
    setAppointments(appointments.map(apt => 
      apt.id === id ? { ...apt, selected: checked } : apt
    ));
  };

  const allSelected = appointments.length > 0 && appointments.every(apt => apt.selected);
  const someSelected = appointments.some(apt => apt.selected) && !allSelected;

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
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <button
              onClick={() => setActiveTab('Appointmanrts')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'Appointmanrts'
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Appointmanrts
            </button>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Answers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <Checkbox
                      checked={appointment.selected}
                      onCheckedChange={(checked) => handleSelectAppointment(appointment.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{appointment.name}</TableCell>
                  <TableCell>{appointment.time}</TableCell>
                  <TableCell>{appointment.resource || '-'}</TableCell>
                  <TableCell className="text-gray-600">{appointment.answers}</TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No appointments found
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

export default Reporting;
