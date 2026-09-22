// client/src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AuthSuccess from './pages/AuthSuccess';
import Dashboard from './pages/Dashboard';
import RepoSelect from './pages/RepoSelect';
import ScanResults from './pages/ScanResults';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/success" element={<AuthSuccess />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/repos" element={<RepoSelect />} />
      <Route path="/scan/:repoId" element={<ScanResults />} />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;