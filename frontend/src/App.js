import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorMedicines from './pages/doctor/DoctorMedicines';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientMedicines from './pages/patient/PatientMedicines';
import PatientReminders from './pages/patient/PatientReminders';
import PatientProfile from './pages/patient/PatientProfile';
import PatientAdherence from './pages/patient/PatientAdherence';

// Layout
import AppLayout from './components/common/AppLayout';
import LoadingScreen from './components/common/LoadingScreen';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    return <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  }
  return children;
};

const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
    <Route path="/reset-password/:token" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

    {/* Doctor */}
    <Route path="/doctor" element={<ProtectedRoute role="doctor"><AppLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<DoctorDashboard />} />
      <Route path="patients" element={<DoctorPatients />} />
      <Route path="medicines" element={<DoctorMedicines />} />
      <Route path="profile" element={<DoctorProfile />} />
    </Route>

    {/* Patient */}
    <Route path="/patient" element={<ProtectedRoute role="patient"><AppLayout /></ProtectedRoute>}>
      <Route path="dashboard" element={<PatientDashboard />} />
      <Route path="medicines" element={<PatientMedicines />} />
      <Route path="reminders" element={<PatientReminders />} />
      <Route path="adherence" element={<PatientAdherence />} />
      <Route path="profile" element={<PatientProfile />} />
    </Route>

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            duration: 3000
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
