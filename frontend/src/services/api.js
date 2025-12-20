import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Update with your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const tokens = localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : sessionStorage.getItem("authTokens")
        ? JSON.parse(sessionStorage.getItem("authTokens"))
        : null;

    if (tokens && tokens.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem("authTokens")
          ? JSON.parse(localStorage.getItem("authTokens"))
          : sessionStorage.getItem("authTokens")
            ? JSON.parse(sessionStorage.getItem("authTokens"))
            : null;

        if (tokens && tokens.refresh) {
          const response = await axios.post('http://localhost:8000/api/auth/refresh/', {
            refresh: tokens.refresh,
          });

          const newTokens = { ...tokens, access: response.data.access };

          // Update tokens in storage
          if (localStorage.getItem("authTokens")) {
            localStorage.setItem("authTokens", JSON.stringify(newTokens));
          } else if (sessionStorage.getItem("authTokens")) {
            sessionStorage.setItem("authTokens", JSON.stringify(newTokens));
          }

          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        localStorage.removeItem("authTokens");
        sessionStorage.removeItem("authTokens");
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (userData) => api.post('/auth/register/', userData),
  refreshToken: (refreshToken) => api.post('/auth/refresh/', { refresh: refreshToken }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/profile/'),
  updateProfile: (userData) => api.patch('/profile/', userData),
};

// Appointment API
export const appointmentAPI = {
  getAppointments: () => api.get('/appointments/'),
  getAppointment: (id) => api.get(`/appointments/${id}/`),
  createAppointment: (appointmentData) => api.post('/appointments/', appointmentData),
  updateAppointment: (id, status) => api.patch(`/appointments/${id}/`, { status }),
  cancelAppointment: (id) => api.patch(`/appointments/${id}/`, { status: 'cancelled' }),
};

// Service API
export const serviceAPI = {
  getServices: () => api.get('/services/'),
  getService: (id) => api.get(`/services/${id}/`),
  createService: (serviceData) => api.post('/services/', serviceData),
  updateService: (id, serviceData) => api.patch(`/services/${id}/`, serviceData),
  deleteService: (id) => api.delete(`/services/${id}/`),
  addQuestion: (id, questionData) => api.post(`/services/${id}/questions/`, questionData),
  getServiceSlots: (serviceId) => api.get(`/admin/services/${serviceId}/slots/`),
};

// Booking API
export const bookingAPI = {
  getBookings: () => api.get('/bookings/'),
  getBooking: (id) => api.get(`/bookings/${id}/`),
  createBooking: (bookingData) => api.post('/bookings/', bookingData),
  updateBooking: (id, bookingData) => api.patch(`/bookings/${id}/`, bookingData),
  deleteBooking: (id) => api.delete(`/bookings/${id}/`),
};

// Resource API
export const resourceAPI = {
  getResources: () => api.get('/resources/'),
  getResource: (id) => api.get(`/resources/${id}/`),
  createResource: (resourceData) => api.post('/resources/', resourceData),
  updateResource: (id, resourceData) => api.patch(`/resources/${id}/`, resourceData),
  deleteResource: (id) => api.delete(`/resources/${id}/`),
};

export default api;