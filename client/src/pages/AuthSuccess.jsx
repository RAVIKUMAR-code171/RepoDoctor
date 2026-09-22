// client/src/pages/AuthSuccess.jsx

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Save the token in the browser so future requests can use it
      localStorage.setItem('devdebt_token', token);
      // Send the user to the dashboard
      navigate('/dashboard');
    } else {
      // No token found, something went wrong, send back to login
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ color: '#ffffff', textAlign: 'center', marginTop: '100px' }}>
      Logging you in...
    </div>
  );
}

export default AuthSuccess;