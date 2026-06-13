import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages import
import HomePage from "./pages/HomePage"; 
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboard from "./pages/AdminDashboard";
import MissionPage from './pages/MissionPage';
import SafetyPage from './pages/SafetyPage';
import CommunityPage from './pages/CommunityPage';
function App() {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} /> 
        
        {/* Auth Page logic */}
        <Route 
          path="/auth" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <AuthPage />} 
        />
        
        {/* Dashboard: Ab isi page ke andar aapki chat chalegi */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/auth" />} 
        />

        {/* Catch-all route */}
       <Route path="/admin-panel" element={<AdminDashboard />} />
<Route path="/mission" element={<MissionPage />} />
<Route path="/safety" element={<SafetyPage />} />
<Route path="/community" element={<CommunityPage />} />
<Route path="*" element={<Navigate to="/" />} />   // ← HAMESHA SABSE LAST
      </Routes>
    </Router>
  );
}

export default App;