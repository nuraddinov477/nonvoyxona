import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout, { getMenuForRole } from './components/Layout';
import Login from './pages/Login';
import Production from './pages/production/Production';
import Trade from './pages/trade/Trade';
import Points from './pages/points/Points';
import Accounting from './pages/accounting/Accounting';
import HR from './pages/hr/HR';

function PrivateRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    const menu = getMenuForRole(user.role);
    const home = menu[0]?.path || '/login';
    return <Navigate to={home} replace />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute allowedRoles={['admin', 'manager', 'baker']}>
              <Production />
            </PrivateRoute>
          } />
          <Route path="/trade" element={
            <PrivateRoute allowedRoles={['admin', 'manager', 'seller']}>
              <Trade />
            </PrivateRoute>
          } />
          <Route path="/points" element={
            <PrivateRoute allowedRoles={['admin', 'manager', 'point_seller']}>
              <Points />
            </PrivateRoute>
          } />
          <Route path="/accounting" element={
            <PrivateRoute allowedRoles={['admin', 'manager', 'accountant']}>
              <Accounting />
            </PrivateRoute>
          } />
          <Route path="/hr" element={
            <PrivateRoute allowedRoles={['admin', 'manager']}>
              <HR />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
