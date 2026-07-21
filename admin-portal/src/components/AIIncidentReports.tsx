interface AIIncidentReportsProps {
  incidents: any[];
}

export function AIIncidentReports({ incidents }: AIIncidentReportsProps) {
  return (
    <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>AI Incident Reports</h3>
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
