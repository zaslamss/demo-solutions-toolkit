import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { DynamicWizard } from './pages/DynamicWizard';
import { NavBar } from './components/NavBar';
import { ToolProvider } from './components/ToolContext';
import './Styles.scss'

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <NavBar />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/:slug"
          element={
            <ProtectedRoute>
              <ToolProvider>
                <NavBar />
                <DynamicWizard />
              </ToolProvider>
            </ProtectedRoute>
          } />
          <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <NavBar />
              <Settings />
            </ProtectedRoute>
          } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
