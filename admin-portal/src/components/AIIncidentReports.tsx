import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface AIIncidentReportsProps {
  incidents: any[];
  isSuperadmin: boolean;
}

export function AIIncidentReports({ incidents, isSuperadmin }: AIIncidentReportsProps) {
  const [clearing, setClearing] = useState(false);

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all incident reports? This cannot be undone.')) return;
    setClearing(true);
    try {
      const snapshot = await getDocs(collection(db, 'ai_incidents'));
      const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'ai_incidents', d.id)));
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Failed to clear incidents:', err);
      alert('Failed to clear incidents.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: 'var(--text-color)' }}>AI Incident Reports</h3>
        {isSuperadmin && incidents.length > 0 && (
          <button
            onClick={handleClearAll}
            disabled={clearing}
            style={{
              background: 'transparent',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              cursor: clearing ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              opacity: clearing ? 0.5 : 1
            }}
          >
            <Trash2 size={14} /> {clearing ? 'Clearing...' : 'Clear All'}
          </button>
        )}
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Shows recent AI provider failures, API errors, or rate limits.
      </p>
      {incidents.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No incidents recorded recently.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {incidents.map((incident) => (
            <li key={incident.id} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontWeight: 'bold', color: '#ef4444' }}>{incident.providerId} ({incident.type})</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(incident.timestamp).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', marginBottom: '0.25rem' }}>
                <strong>Error:</strong> {incident.error}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Source: {incident.source}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
