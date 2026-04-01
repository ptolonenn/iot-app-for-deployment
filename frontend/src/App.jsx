import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Todos from './pages/Todos';
import TodoPage from './pages/TodoPage';
import Feedback from './pages/Feedback';
import Account from './pages/Account';
import Footer from './components/Footer';
import { isAuthenticated, removeAuthToken } from './lib/auth';
import './App.css';

function ProtectedRoute({ children }) {
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const auth = isAuthenticated();
    console.log('ProtectedRoute check at', location.pathname, ':', auth);
    setAuthenticated(auth);
    setAuthChecked(true);
  }, [location.pathname]);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return authenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

// Navigation component - will be used inside the Router
function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  // Don't show navigation on login page
  if (location.pathname === '/login') {
    return null;
  }

  // Only show navigation if authenticated
  if (!authenticated) {
    return null;
  }

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Link to="/todos" style={{ color: 'white', textDecoration: 'none' }}>
          My Todos
        </Link>
        <Link to="/account" style={{ color: 'white', textDecoration: 'none' }}>
          My Account
        </Link>
        <Link to="/feedback" style={{ color: 'white', textDecoration: 'none' }}>
          Feedback
        </Link>
      </div>
      <button onClick={handleLogout} style={{
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        borderRadius: '4px'
      }}>
        Logout
      </button>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <div style={{ paddingTop: '20px' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/todos"
            element={
              <ProtectedRoute>
                <Todos />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/todos/:id"
            element={
              <ProtectedRoute>
                <TodoPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/todos" replace />} />
          <Route path="*" element={<Navigate to="/todos" replace />} />
        </Routes>
      </div>
      <Footer />
    </BrowserRouter>
  );
}

export default App;