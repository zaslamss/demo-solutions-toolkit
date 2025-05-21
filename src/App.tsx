// React Imports
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import { Dashboard } from './pages/Dashboard'
import Login from './pages/Login';
import { Tool } from './pages/Tool';

// Components
import { ProtectedRoute } from './auth/ProtectedRoute';
import NavBar from './components/NavBar';

// Styles
import './Styles.scss'
// import 'bootstrap/dist/css/bootstrap.min.css';
// import './App.css';

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
              <NavBar />
              <Tool />
            </ProtectedRoute>
          } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
