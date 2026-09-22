// client/src/pages/ScanResults.jsx

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axios';

function ScanResults() {
  const { repoId } = useParams();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`/scan/${repoId}`);
      setScan(res.data.scan);
    } catch (err) {
      setError(err.response?.data?.error || 'Scan failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      <h2>Repository Scan</h2>

      <button onClick={runScan} disabled={loading} style={{ padding: '8px 16px', marginBottom: 20 }}>
        {loading ? 'Scanning... this can take a minute' : 'Run Scan'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {scan && (
        <>
          <p>
            <strong>{scan.fileCount}</strong> files analyzed &middot;{' '}
            <strong>{scan.cycleCount}</strong> circular dependency cluster(s) found
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>File</th>
                <th style={{ padding: 8 }}>Risk Score</th>
                <th style={{ padding: 8 }}>PageRank</th>
                <th style={{ padding: 8 }}>Fragile (cycle)</th>
                <th style={{ padding: 8 }}>Debt Issues</th>
              </tr>
            </thead>
            <tbody>
              {scan.results.map((r) => (
                <tr key={r.filePath} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 13 }}>{r.filePath}</td>
                  <td style={{ padding: 8, fontWeight: 'bold' }}>{r.riskScore}</td>
                  <td style={{ padding: 8 }}>{r.pageRank}</td>
                  <td style={{ padding: 8 }}>{r.inCycle ? '⚠️ Yes' : '—'}</td>
                  <td style={{ padding: 8 }}>{r.debtCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default ScanResults;
