// client/src/pages/RepoSelect.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function RepoSelect() {
  const [repos, setRepos] = useState([]);
  const [trackedIds, setTrackedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('devdebt_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [githubRes, trackedRes] = await Promise.all([
        api.get('/repos/github'),
        api.get('/repos/tracked')
      ]);
      setRepos(githubRes.data.repos);
      setTrackedIds(trackedRes.data.repos.map(r => r.githubRepoId));
    } catch (err) {
      console.error(err);
      setError('Failed to load repos');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (repo) => {
    try {
      await api.post('/repos/track', repo);
      setTrackedIds(prev => [...prev, repo.githubRepoId]);
    } catch (err) {
      console.error(err);
      alert('Failed to track repo (maybe already tracked?)');
    }
  };

  if (loading) return <div style={{ color: '#fff', padding: '40px' }}>Loading your repos...</div>;
  if (error) return <div style={{ color: 'red', padding: '40px' }}>{error}</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#0d1117', minHeight: '100vh', color: '#fff' }}>
      <h1>Select Repos to Track</h1>
      <p style={{ color: '#8b949e' }}>Choose which of your GitHub repos you want DevDebt to analyze.</p>

      <div style={{ marginTop: '24px' }}>
        {repos.map(repo => {
          const isTracked = trackedIds.includes(repo.githubRepoId);
          return (
            <div key={repo.githubRepoId} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#161b22',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '12px',
              border: '1px solid #30363d'
            }}>
              <div>
                <strong>{repo.name}</strong>
                <div style={{ fontSize: '13px', color: '#8b949e' }}>
                  {repo.language || 'Unknown language'} {repo.description ? `— ${repo.description}` : ''}
                </div>
              </div>
              <button
                disabled={isTracked}
                onClick={() => handleTrack(repo)}
                style={{
                  backgroundColor: isTracked ? '#30363d' : '#238636',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: isTracked ? 'default' : 'pointer'
                }}
              >
                {isTracked ? 'Tracked' : 'Track'}
              </button>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate('/dashboard')}
        style={{ marginTop: '24px', padding: '10px 20px', backgroundColor: '#21262d', color: '#fff', border: '1px solid #30363d', borderRadius: '6px', cursor: 'pointer' }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}

export default RepoSelect;