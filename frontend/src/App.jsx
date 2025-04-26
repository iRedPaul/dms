import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { de } from 'date-fns/locale';

// Theme
import theme from './styles/theme';

// Context Provider
import { AuthProvider } from './context/AuthContext';

// Components
import Layout from './components/Shared/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import DocumentList from './components/Documents/DocumentList';
import DocumentUpload from './components/Documents/DocumentUpload';
import DocumentView from './components/Documents/DocumentView';
import InboxView from './components/Workflows/InboxView';
import WorkflowTasks from './components/Workflows/WorkflowTasks';
import Archive from './components/Documents/Archive';

// Admin Pages
import AdminDashboard from './components/Admin/Dashboard';
import UserManagement from './components/Admin/UserManagement';
import InboxManagement from './components/Admin/InboxManagement';
import WorkflowDesigner from './components/Admin/WorkflowBuilder/WorkflowDesigner';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={de}>
        <Router>
          <AuthProvider>
            <Routes>
              {/* Öffentliche Routen */}
              <Route path="/login" element={<Login />} />
              
              {/* Geschützte Routen */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                
                {/* Dokumente */}
                <Route path="documents" element={<DocumentList />} />
                <Route path="documents/upload" element={<DocumentUpload />} />
                <Route path="documents/:id" element={<DocumentView />} />
                <Route path="archive" element={<Archive />} />
                
                {/* Workflows */}
                <Route path="inbox/:id" element={<InboxView />} />
                <Route path="tasks" element={<WorkflowTasks />} />
                
                {/* Admin-Bereich */}
                <Route path="admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
                <Route path="admin/users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
                <Route path="admin/inboxes" element={<ProtectedRoute requiredRole="admin"><InboxManagement /></ProtectedRoute>} />
                <Route path="admin/workflows" element={<ProtectedRoute requiredRole={["admin", "workflow-designer"]}><WorkflowDesigner /></ProtectedRoute>} />
              </Route>
              
              {/* Fallback-Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
