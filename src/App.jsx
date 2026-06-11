import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute, { PublicRoute } from './components/PrivateRoute';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import Dashboard from './pages/Dashboard';
import IncidentsPage from './pages/IncidentsPage';
import SettingsPage from './pages/SettingsPage';
import CustomRulesPage from './pages/CustomRulesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserManagementPage from './pages/UserManagementPage';
import DocsPage from './pages/DocsPage';
import RuleAnalyticsPage from './pages/RuleAnalyticsPage';
import AuditLogPage from './pages/AuditLogPage';
import './index.css';

const PUBLIC_ROUTES   = ['/login', '/register'];
const FULL_PAGE_ROUTES = ['/docs'];

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const isPublic   = PUBLIC_ROUTES.includes(location.pathname);
  const isFullPage = FULL_PAGE_ROUTES.includes(location.pathname);
  const showSidebar = !isPublic && !isFullPage && !loading && isAuthenticated();

  return (
    <div className={isPublic ? 'auth-wrapper' : 'app-container'}>
      {showSidebar && <Sidebar />}
      {showSidebar && <NotificationBell />}
      <main
        className={isPublic ? 'auth-content' : 'main-content'}
        style={isFullPage ? { padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' } : undefined}
      >
        <Routes>
          {/* Public */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/custom-rules" element={<CustomRulesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/analytics/rules" element={<RuleAnalyticsPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/docs" element={<DocsPage />} />
          </Route>

          {/* Admin only */}
          <Route element={<PrivateRoute requiredRole="ADMIN" />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>

          <Route path="*" element={<PrivateRoute><Navigate to="/" replace /></PrivateRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
