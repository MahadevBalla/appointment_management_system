import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Settings as SettingsIcon, 
  BarChart3,
  Calendar,
  Plus,
  ChevronDown
} from 'lucide-react';

const Resources = () => {
  const navigate = useNavigate();

  // Resources state
  const [resources, setResources] = useState([
    {
      id: 1,
      name: 'Court 1',
      capacity: 2,
      linkedResources: ['Court 2', 'Court 3', 'Court 4'],
    },
  ]);

  const [currentResource, setCurrentResource] = useState(resources[0]);
  const [availableResources, setAvailableResources] = useState([
    'Court 2',
    'Court 3', 
    'Court 4',
    'Court 5',
    'Court 6'
  ]);

  const handleAddLinkedResource = (resource) => {
    if (!currentResource.linkedResources.includes(resource)) {
      setCurrentResource({
        ...currentResource,
        linkedResources: [...currentResource.linkedResources, resource]
      });
    }
  };

  const handleRemoveLinkedResource = (resource) => {
    setCurrentResource({
      ...currentResource,
      linkedResources: currentResource.linkedResources.filter(r => r !== resource)
    });
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
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Resource</h1>
          <Button
            variant="outline"
            onClick={() => {/* Add new resource */}}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        {/* Resource Form */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="resource-name" className="text-sm font-semibold text-gray-700">
                Name
              </Label>
              <Input
                id="resource-name"
                value={currentResource.name}
                onChange={(e) => setCurrentResource({ ...currentResource, name: e.target.value })}
                placeholder="Enter resource name"
                className="w-full"
              />
            </div>

            {/* Capacity Field */}
            <div className="space-y-2">
              <Label htmlFor="resource-capacity" className="text-sm font-semibold text-gray-700">
                Capacity
              </Label>
              <Input
                id="resource-capacity"
                type="number"
                value={currentResource.capacity}
                onChange={(e) => setCurrentResource({ ...currentResource, capacity: parseInt(e.target.value) || 0 })}
                placeholder="Enter capacity"
                className="w-32"
                min="0"
              />
            </div>

            {/* Linked Resources */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">
                Linked resources
              </Label>
              
              {/* Dropdown to add linked resources */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full max-w-xs justify-between"
                  >
                    <span className="text-gray-600">Select resources to link...</span>
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {availableResources
                    .filter(r => !currentResource.linkedResources.includes(r))
                    .map((resource) => (
                      <DropdownMenuItem 
                        key={resource}
                        onClick={() => handleAddLinkedResource(resource)}
                      >
                        {resource}
                      </DropdownMenuItem>
                    ))}
                  {availableResources.filter(r => !currentResource.linkedResources.includes(r)).length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      No resources available
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Display linked resources */}
              {currentResource.linkedResources.length > 0 && (
                <div className="space-y-2 mt-3">
                  {currentResource.linkedResources.map((resource) => (
                    <div 
                      key={resource}
                      className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-md"
                    >
                      <span className="text-sm text-gray-700">{resource}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLinkedResource(resource)}
                        className="h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-teal-600 text-white hover:bg-teal-700"
              >
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resources;
