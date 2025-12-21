import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { MantineProvider, ActionIcon, Drawer } from '@mantine/core';
import { MessageCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { refreshToken, fetchProfile } from './slices/authSlice';
import NavBar from "./components/NavBar";
import Home from "./pgs/Home";
import Signup from "./pgs/Signup";
import './index.css'; // or whatever you named your CSS file
const Profile = lazy(() => import("./pgs/Profile"));
const Login = lazy(() => import("./pgs/Login"));
const About = lazy(() => import("./pgs/About"));
const Dashboard = lazy(() => import("./pgs/Appointments"));
const AppointmentForm = lazy(() => import("./pgs/AppointmentForm"));
const Resources = lazy(() => import("./pgs/Resources"));
const Users = lazy(() => import("./pgs/Users"));
const Meetings = lazy(() => import("./pgs/Meetings"));
const Reporting = lazy(() => import("./pgs/Reporting"));
const CustomerHome = lazy(() => import("./pgs/CustomerHome"));
const CustomerAppointment = lazy(() => import("./pgs/CustomerAppointment"));
const CustomerBooking = lazy(() => import("./pgs/CustomerBooking"));
const BookingDetails = lazy(() => import("./pgs/BookingDetails"));
const BookingConfirmation = lazy(() => import("./pgs/BookingConfirmation"));
const CustomerProfile = lazy(() => import("./pgs/CustomerProfile"));
const BookingAssistant = lazy(() => import("./components/BookingAssistant"));


function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Login />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Login />;
  }

  // Redirect customers to customer home
  if (user && user.role === 'customer') {
    return <Navigate to="/customerhome" replace />;
  }
  return children;
}

const App = () => {
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();
  const { tokens } = useSelector(state => state.auth);

  // Hide navbar on specific routes
  const hideNavBar = location.pathname.startsWith('/book/');

  useEffect(() => {
    let interval;
    if (tokens) {
      dispatch(fetchProfile(tokens.access));
      interval = setInterval(() => dispatch(refreshToken(tokens.refresh)), 4 * 60 * 1000);
    }
    return () => clearInterval(interval);
  }, [tokens, dispatch]);

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <div className="relative flex flex-col min-h-screen">
        {!hideNavBar && <NavBar />}
        <div className={`flex items-center justify-center grow ${hideNavBar ? '' : 'pt-20'} bg-gray-50`}>
          <Suspense fallback={<div className="p-6 text-center">Loading...</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customerhome"
                element={
                  <PrivateRoute>
                    <CustomerHome />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customer/appointment/:id"
                element={
                  <PrivateRoute>
                    <CustomerAppointment />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customer/appointment/:id/book"
                element={
                  <PrivateRoute>
                    <CustomerBooking />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customer/appointment/:id/book/booking-details"
                element={
                  <PrivateRoute>
                    <BookingDetails />
                  </PrivateRoute>
                }
              />
              <Route
                path="/customerprofile"
                element={
                  <PrivateRoute>
                    <CustomerProfile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admindashboard"
                element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admindashboard/:id/edit"
                element={
                  <AdminRoute>
                    <AppointmentForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/settings/resources"
                element={
                  <AdminRoute>
                    <Resources />
                  </AdminRoute>
                }
              />
              <Route
                path="/settings/users"
                element={
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                }
              />
              <Route
                path="/meetings"
                element={
                  <AdminRoute>
                    <Meetings />
                  </AdminRoute>
                }
              />
              <Route
                path="/reporting"
                element={
                  <AdminRoute>
                    <Reporting />
                  </AdminRoute>
                }
              />
              <Route
                path="/customer/:id/success"
                element={
                  <PrivateRoute>
                    <BookingConfirmation />
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </div>

        <div className="fixed bottom-6 right-6 z-50">
          <ActionIcon
            variant="filled"
            color="teal"
            radius="xl"
            size="xl"
            onClick={() => setChatDrawerOpen(true)}
            className="w-14 h-14 shadow-lg bg-linear-to-r! from-red-500! to-orange-500! text-white! font-semibold! shadow-red-500/50! transform! hover:scale-103 transition-all! duration-300! hover:bg-linear-to-r! hover:from-orange-500! hover:to-red-500! 
active:scale-95! active:shadow-orange-600/50! focus:outline-none! focus:ring-2!"
          >
            <MessageCircle size={24} />
          </ActionIcon>
        </div>

        <Drawer
          opened={chatDrawerOpen}
          onClose={() => setChatDrawerOpen(false)}
          padding={0}
          size="xl"
          position="right"
          title=""
          classNames={{ title: 'text-teal-600 font-bold px-4 py-2' }}
          zIndex={1000}
        >
          <div className="h-full">
            <BookingAssistant isVisible={chatDrawerOpen} />
          </div>
        </Drawer>
      </div>
    </MantineProvider>
  );
};

export default App;