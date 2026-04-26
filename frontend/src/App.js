import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Production from './pages/production/Production';
import Trade from './pages/trade/Trade';
import Points from './pages/points/Points';
import Accounting from './pages/accounting/Accounting';
import HR from './pages/hr/HR';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Production /></PrivateRoute>} />
          <Route path="/trade" element={<PrivateRoute><Trade /></PrivateRoute>} />
          <Route path="/points" element={<PrivateRoute><Points /></PrivateRoute>} />
          <Route path="/accounting" element={<PrivateRoute><Accounting /></PrivateRoute>} />
          <Route path="/hr" element={<PrivateRoute><HR /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
