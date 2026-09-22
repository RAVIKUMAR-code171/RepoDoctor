// client/src/pages/Dashboard.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('devdebt_token');
    if (!savedToken) {
      // No token found, user isn't logged in, kick them back to login
      navigate('/login');
    } else {
      setToken(savedToken);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('devdebt_token');
    navigate('/login');
  };

  return (
    <div style={{ padding: '40px', color: '#ffffff', backgroundColor: '#0d1117', minHeight: '100vh' }}>
      <h1>Dashboard</h1>
      <p>You are successfully logged in! 🎉</p>
      <p style={{ fontSize: '12px', color: '#8b949e', wordBreak: 'break-all' }}>
        Token: {token}
      </p>
      <button onClick={handleLogout} style={{ marginTop: '20px', padding: '8px 16px' }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;