import { Routes, Route, Navigate } from 'react-router-dom';

import { ProtectedRoute } from './auth/ProtectedRoute';
import Dashboard from './pages/Dashboard'
import Login from './pages/Login';
import Tool from './Tool';
import NavBar from './components/NavBar';

import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/:slug"
          element={
            <ProtectedRoute>
              <Tool />
            </ProtectedRoute>
          } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
