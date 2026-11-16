import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Login } from './pages/Login.jsx';
import { GateConsole } from './pages/guard/GateConsole.jsx';
import { StudentPortal } from './pages/student/StudentPortal.jsx';
import { WardenConsole } from './pages/warden/WardenConsole.jsx';
import { AdminConsole } from './pages/admin/AdminConsole.jsx';
import { VisitorKiosk } from './pages/visitor/VisitorKiosk.jsx';
import { DigitalPassView } from './pages/visitor/DigitalPassView.jsx';

// Protected Route wrapper with role check
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center text-zinc-500">
        <div className="animate-pulse-subtle font-mono text-xs tracking-wider">VERIFYING SESSION...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective home
    if (user.role === 'GUARD') return <Navigate to="/guard" replace />;
    if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
    if (user.role === 'WARDEN') return <Navigate to="/warden" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Root index redirect based on user role
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'GUARD') return <Navigate to="/guard" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student" replace />;
  if (user.role === 'WARDEN') return <Navigate to="/warden" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  return <Navigate to="/visitor" replace />;
};

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-base text-zinc-900 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomeRedirect />} />
              <Route path="/login" element={<Login />} />

              {/* Public Visitor Portal */}
              <Route path="/visitor" element={<VisitorKiosk />} />
              <Route path="/pass/:id" element={<DigitalPassView />} />

              {/* Role-Protected Consoles */}
              <Route
                path="/guard"
                element={
                  <ProtectedRoute allowedRoles={['GUARD', 'ADMIN', 'WARDEN']}>
                    <GateConsole />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                    <StudentPortal />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/warden"
                element={
                  <ProtectedRoute allowedRoles={['WARDEN', 'ADMIN']}>
                    <WardenConsole />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminConsole />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
