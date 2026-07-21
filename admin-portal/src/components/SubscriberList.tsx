import { Edit, Users } from 'lucide-react';

interface SubscriberListProps {
  subscribers: any[];
  isSuperadmin: boolean;
  onSelectUser: (user: any) => void;
  onEditUser: (e: React.MouseEvent, user: any) => void;
}

export function SubscriberList({ subscribers, isSuperadmin, onSelectUser, onEditUser }: SubscriberListProps) {
  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Users color="var(--accent-color)" />
        <h2 style={{ margin: 0 }}>Subscribers ({subscribers.length})</h2>
      </div>

      <ul className="subscriber-list">
        {subscribers.map((sub) => {
          const isExpired = sub.accessExpiresAtMillis && Date.now() > sub.accessExpiresAtMillis;
          return (
            <li 
              key={sub.id} 
              className="subscriber-item" 
              style={{ alignItems: 'flex-start', cursor: 'pointer' }}
              onClick={() => onSelectUser(sub)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{sub.email || 'Anonymous User'}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>ID: {sub.id.substring(0,8)}...</div>
                {(sub.role || sub.isAdmin || sub.isDeleted) && (
                  <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {sub.isDeleted && <span className="badge" style={{ backgroundColor: '#ef4444' }}>Deleted</span>}
                    {sub.isAdmin && !sub.isDeleted && <span className="badge admin" style={{ backgroundColor: isExpired ? '#ef4444' : undefined }}>{isExpired ? 'Expired Admin' : 'Admin'}</span>}
                    {sub.role && <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>{sub.role}</span>}
                    {sub.accessExpiresAtMillis && (
                      <span className="badge" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: isExpired ? '#ef4444' : 'var(--text-muted)' }}>
                        Expires: {new Date(sub.accessExpiresAtMillis).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {isSuperadmin && sub.email !== 'mosaicmusic02@gmail.com' && (
                <button className="btn" style={{ padding: '0.5rem' }} onClick={(e) => onEditUser(e, sub)}>
                  <Edit size={16} />
                </button>
              )}
            </li>
          );
        })}
        {subscribers.length === 0 && (
          <p style={{ textAlign: 'center', padding: '2rem 0' }}>No subscribers found.</p>
        )}
      </ul>
    </div>
  );
}
