// client/src/pages/Login.jsx

import React from 'react';

function Login() {
  const handleGitHubLogin = () => {
    // Redirect the whole browser to our backend's GitHub auth route
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>DevDebt</h1>
        <p style={styles.subtitle}>Track and fix technical debt in your codebase</p>
        <button style={styles.button} onClick={handleGitHubLogin}>
          Login with GitHub
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#0d1117'
  },
  card: {
    backgroundColor: '#161b22',
    padding: '40px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #30363d'
  },
  title: {
    color: '#ffffff',
    fontSize: '32px',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#8b949e',
    marginBottom: '24px'
  },
  button: {
    backgroundColor: '#238636',
    color: '#ffffff',
    padding: '12px 24px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};

export default Login;