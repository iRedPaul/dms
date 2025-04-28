import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentViewer from './pages/DocumentViewer';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

// Create a modern theme with German blue colors and updated styling
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
    error: {
      main: '#ef5350',
      dark: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
      dark: '#ed6c02',
    },
    info: {
      main: '#03a9f4',
      dark: '#0288d1',
    },
    success: {
      main: '#4caf50',
      dark: '#2e7d32',
    },
    text: {
      primary: '#212121',
      secondary: '#666666',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.1)',
        },
        elevation2: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 3px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.08)',
        },
        elevation4: {
          boxShadow: '0 4px 8px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 4px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f7fa',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minWidth: 100,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '0.9rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
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
        html, body, #root {
          height: 100%;
          margin: 0;
        }

        body {
          font-family: 'Roboto', 'Segoe UI', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #f5f7fa;
          color: #212121;
        }

        @charset "UTF-8";
        * {
          text-rendering: optimizeLegibility;
          box-sizing: border-box;
        }

        /* Fix for German umlauts in all components */
        .MuiTypography-root,
        .MuiButton-root,
        .MuiTextField-root,
        .MuiChip-root,
        .MuiTab-root,
        .MuiAlert-root {
          font-family: 'Roboto', 'Segoe UI', 'Helvetica Neue', sans-serif !important;
        }

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

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a0a0a0;
        }

        /* File type colors for document icons */
        .file-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          margin-right: 12px;
        }

        .file-icon.pdf {
          background-color: rgba(244, 67, 54, 0.1);
          color: #F44336;
        }

        .file-icon.image {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
        }

        .file-icon.word {
          background-color: rgba(33, 150, 243, 0.1);
          color: #2196F3;
        }

        .file-icon.excel {
          background-color: rgba(76, 175, 80, 0.1);
          color: #4CAF50;
        }

        .file-icon.default {
          background-color: rgba(158, 158, 158, 0.1);
          color: #9E9E9E;
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </ThemeProvider>
  );
}

export default App;
