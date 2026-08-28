import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ComplaintDetail from './pages/ComplaintDetail';
import OperationsCenter from './pages/OperationsCenter';
import IncidentsList from './pages/IncidentsList';
import Approvals from './pages/Approvals';
import Analytics from './pages/Analytics';
import AuditTrail from './pages/AuditTrail';
import Emergency from './pages/Emergency';

function RoleHome() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'STUDENT' ? '/dashboard' : '/ops'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<ProtectedRoute allow={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />

            <Route path="/ops" element={<ProtectedRoute allow={['WARDEN', 'ADMIN']}><OperationsCenter /></ProtectedRoute>} />
            <Route path="/incidents" element={<ProtectedRoute allow={['WARDEN', 'ADMIN']}><IncidentsList /></ProtectedRoute>} />
            <Route path="/approvals" element={<ProtectedRoute allow={['WARDEN', 'ADMIN']}><Approvals /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allow={['WARDEN', 'ADMIN']}><Analytics /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute allow={['WARDEN', 'ADMIN']}><AuditTrail /></ProtectedRoute>} />
            <Route path="/emergency" element={<ProtectedRoute allow={['WARDEN', 'ADMIN']}><Emergency /></ProtectedRoute>} />

            <Route path="/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />

            <Route path="/" element={<RoleHome />} />
            <Route path="*" element={<RoleHome />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
