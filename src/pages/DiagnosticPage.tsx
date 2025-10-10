import React, { useEffect, useState } from 'react';
import { fetchAllDiseases } from '../data/diseases';

const DiagnosticPage: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState('idle');

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const testLoad = async () => {
    setLogs([]);
    setStatus('loading');
    addLog('Starting disease data load test...');
    
    try {
      // Test centroids (fake for now)
      const centroids = new Map<string, { lat: number; lng: number }>();
      centroids.set('France', { lat: 46.2, lng: 2.2 });
      centroids.set('Espagne', { lat: 40.4, lng: -3.7 });
      centroids.set('Spain', { lat: 40.4, lng: -3.7 });
      centroids.set('Italie', { lat: 41.9, lng: 12.5 });
      centroids.set('Italy', { lat: 41.9, lng: 12.5 });
      centroids.set('Allemagne', { lat: 51.2, lng: 10.4 });
      centroids.set('Germany', { lat: 51.2, lng: 10.4 });
      centroids.set('Belgique', { lat: 50.5, lng: 4.5 });
      centroids.set('Belgium', { lat: 50.5, lng: 4.5 });
      
      addLog(`Created test centroids: ${centroids.size} entries`);
      
      addLog('Calling fetchAllDiseases...');
      const result = await fetchAllDiseases(centroids, 0); // TTL=0 to force reload
      
      addLog(`fetchAllDiseases returned ${Object.keys(result).length} datasets`);
      
      for (const [key, dataset] of Object.entries(result)) {
        addLog(`Dataset "${key}": ${dataset.countries.length} countries, ${dataset.points.length} map points`);
        const totalCases = dataset.countries.reduce((sum, c) => sum + c.cases, 0);
        addLog(`  Total cases: ${totalCases}`);
      }
      
      setStatus('success');
    } catch (e) {
      addLog(`ERROR: ${e instanceof Error ? e.message : String(e)}`);
      setStatus('error');
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', background: '#0b1220', minHeight: '100vh', color: '#d2e0f2' }}>
      <h1>Disease Data Diagnostic</h1>
      <button onClick={testLoad} style={{ padding: '8px 16px', marginBottom: 16 }}>
        Run Test Load
      </button>
      <div style={{ marginBottom: 8 }}>Status: <strong>{status}</strong></div>
      <div style={{ background: '#0e1626', border: '1px solid #27364a', padding: 12, borderRadius: 6 }}>
        <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
          {logs.length === 0 && <div style={{ color: '#777' }}>Click "Run Test Load" to start...</div>}
          {logs.map((log, i) => (
            <div key={i} style={{ color: log.includes('ERROR') ? '#ff6b6b' : '#a8d5ff' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16, fontSize: '0.85rem', color: '#777' }}>
        Open browser DevTools Console for detailed [diseases] logs.
      </div>
    </div>
  );
};

export default DiagnosticPage;
