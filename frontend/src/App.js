import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentViewer from './pages/DocumentViewer';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

// Create a modern theme with German blue colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#0063a6', // German blue
      light: '#4090d6',
      dark: '#003c78',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057',
      light: '#ff5983',
      dark: '#bb002f',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px -1px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, currentUser } = useAuth();
  
  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: theme.palette.background.default 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader"></div>
          <p>Wird geladen...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to dashboard if admin is required but user is not admin
  if (requireAdmin && !currentUser?.isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/documents/:id" element={
            <ProtectedRoute>
              <DocumentViewer />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      
      {/* Global styles */}
      <style jsx global>{`
        .loader {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #0063a6;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </ThemeProvider>
  );
}

export default App;
