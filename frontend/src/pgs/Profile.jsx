import { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Title, 
  TextInput, 
  Select, 
  Button, 
  Alert, 
  Loader, 
  Group, 
  Text, 
  Badge, 
  Divider, 
  Avatar, 
  Stack,
  Grid,
  Card
} from '@mantine/core';
import { 
  IconCheck, 
  IconAlertCircle, 
  IconEdit, 
  IconX, 
  IconUser, 
  IconMail, 
  IconPhone, 
  IconBell, 
  IconShieldCheck 
} from '@tabler/icons-react';
import NavBar from '../components/NavBar';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  const [profileData, setProfileData] = useState({
    email: '',
    full_name: '',
    phone_no: '',
    notification_preference: 'both',
    role: ''
  });

  const [formData, setFormData] = useState({
    full_name: '',
    phone_no: '',
    notification_preference: 'both'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const authTokens = localStorage.getItem('authTokens') || sessionStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('No authentication token found');
      }
      
      const tokens = JSON.parse(authTokens);
      const response = await fetch('http://localhost:8000/api/profile/', {
        headers: {
          'Authorization': `Bearer ${tokens.access}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');
      
      const data = await response.json();
      setProfileData(data);
      setFormData({
        full_name: data.full_name || '',
        phone_no: data.phone_no || '',
        notification_preference: data.notification_preference || 'both'
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const authTokens = localStorage.getItem('authTokens') || sessionStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('No authentication token found');
      }
      
      const tokens = JSON.parse(authTokens);
      const response = await fetch('http://localhost:8000/api/profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${tokens.access}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const updatedData = await response.json();
      setProfileData(updatedData);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profileData.full_name || '',
      phone_no: profileData.phone_no || '',
      notification_preference: profileData.notification_preference || 'both'
    });
    setEditMode(false);
    setError('');
  };

  const getNotificationLabel = (pref) => {
    const labels = {
      'email': 'Email Only',
      'sms': 'SMS Only',
      'both': 'Email & SMS',
      'none': 'Disabled'
    };
    return labels[pref] || pref;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'patient': 'blue',
      'doctor': 'green',
      'admin': 'red'
    };
    return colors[role] || 'gray';
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <Container size="md" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Loader size="lg" />
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Container size="" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" mb="md" onClose={() => setError('')} withCloseButton>
            {error}
          </Alert>
        )}

        {success && (
          <Alert icon={<IconCheck size={16} />} color="green" mb="md" onClose={() => setSuccess('')} withCloseButton>
            {success}
          </Alert>
        )}

        {/* Profile Header Card */}
        <Paper shadow="md" p="xl" radius="md" mb="lg">
          <Group position="apart" mb="lg">
            <Group>
              <Avatar size={80} radius="xl" color="teal">
                <IconUser size={40} />
              </Avatar>
              <div>
                <Title order={2}>{profileData.full_name || 'User'}</Title>
                <Text size="sm" color="dimmed">{profileData.email}</Text>
                <Badge color={getRoleBadgeColor(profileData.role)} mt="xs">
                  {profileData.role?.toUpperCase() || 'USER'}
                </Badge>
              </div>
            </Group>
            {!editMode && (
              <Button 
                leftIcon={<IconEdit size={16} />} 
                variant="light" 
                color="teal"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </Button>
            )}
          </Group>
        </Paper>

        {/* Profile Details / Edit Form */}
        {!editMode ? (
          // VIEW MODE - Dashboard
          <Grid gutter="md">
            <Grid.Col span={12}>
              <Card shadow="sm" p="lg" radius="md" withBorder>
                <Title order={3} mb="md">Profile Information</Title>
                <Divider mb="md" />
                
                <Stack spacing="lg">
                  <Group>
                    <IconMail size={20} color="teal" />
                    <div style={{ flex: 1 }}>
                      <Text size="xs" color="dimmed" transform="uppercase" weight={600}>Email Address</Text>
                      <Text size="md">{profileData.email || 'Not provided'}</Text>
                    </div>
                  </Group>

                  <Group>
                    <IconUser size={20} color="teal" />
                    <div style={{ flex: 1 }}>
                      <Text size="xs" color="dimmed" transform="uppercase" weight={600}>Full Name</Text>
                      <Text size="md">{profileData.full_name || 'Not provided'}</Text>
                    </div>
                  </Group>

                  <Group>
                    <IconPhone size={20} color="teal" />
                    <div style={{ flex: 1 }}>
                      <Text size="xs" color="dimmed" transform="uppercase" weight={600}>Phone Number</Text>
                      <Text size="md">{profileData.phone_no || 'Not provided'}</Text>
                    </div>
                  </Group>

                  <Group>
                    <IconBell size={20} color="teal" />
                    <div style={{ flex: 1 }}>
                      <Text size="xs" color="dimmed" transform="uppercase" weight={600}>Notification Preference</Text>
                      <Badge color="blue" size="lg" mt={4}>
                        {getNotificationLabel(profileData.notification_preference)}
                      </Badge>
                    </div>
                  </Group>

                  <Group>
                    <IconShieldCheck size={20} color="teal" />
                    <div style={{ flex: 1 }}>
                      <Text size="xs" color="dimmed" transform="uppercase" weight={600}>Account Role</Text>
                      <Text size="md">{profileData.role?.charAt(0).toUpperCase() + profileData.role?.slice(1) || 'User'}</Text>
                    </div>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          </Grid>
        ) : (
          // EDIT MODE - Form
          <Paper shadow="md" p="xl" radius="md">
            <Group position="apart" mb="lg">
              <Title order={3}>Edit Profile</Title>
              <Button 
                leftIcon={<IconX size={16} />} 
                variant="subtle" 
                color="gray"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Group>
            
            <Divider mb="lg" />

            <form onSubmit={handleSubmit}>
              <Stack spacing="md">
                <TextInput
                  label="Email Address"
                  icon={<IconMail size={16} />}
                  value={profileData.email}
                  disabled
                  description="Email cannot be changed"
                />

                <TextInput
                  label="Full Name"
                  icon={<IconUser size={16} />}
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  placeholder="Enter your full name"
                />

                <TextInput
                  label="Phone Number"
                  icon={<IconPhone size={16} />}
                  value={formData.phone_no}
                  onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                  placeholder="+1234567890"
                  description="Include country code"
                />

                <Select
                  label="Notification Preference"
                  icon={<IconBell size={16} />}
                  value={formData.notification_preference}
                  onChange={(value) => setFormData({ ...formData, notification_preference: value })}
                  data={[
                    { value: 'email', label: 'Email Only' },
                    { value: 'sms', label: 'SMS Only' },
                    { value: 'both', label: 'Both Email & SMS' },
                    { value: 'none', label: 'No Notifications' }
                  ]}
                  description="Choose how you want to receive notifications"
                />

                <TextInput
                  label="Account Role"
                  icon={<IconShieldCheck size={16} />}
                  value={profileData.role}
                  disabled
                  description="Role cannot be changed"
                />

                <Group position="right" mt="xl">
                  <Button variant="subtle" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={updating} leftIcon={<IconCheck size={16} />}>
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}
      </Container>
    </>
  );
};

export default Profile;