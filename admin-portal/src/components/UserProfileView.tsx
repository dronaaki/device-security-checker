import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, doc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { ArrowLeft, Trash2, Key, AlertTriangle, MessageSquare, Bell, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db, auth } from '../firebase';

export function UserProfileView({ user, onClose, onUserUpdated }: { user: any, onClose: () => void, onUserUpdated: (u: any) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'notifications' | 'ai'>('overview');
  const [logs, setLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [aiChats, setAiChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const logsQ = query(collection(db, 'users', user.id, 'securityLogs'), orderBy('timestamp', 'desc'));
        const notifQ = query(collection(db, 'users', user.id, 'notifications'), orderBy('timestamp', 'desc'));
        const aiQ = query(collection(db, 'users', user.id, 'ai_conversations'), orderBy('timestamp', 'asc'));

        const [logsSnap, notifSnap, aiSnap] = await Promise.all([
          getDocs(logsQ), getDocs(notifQ), getDocs(aiQ)
        ]);

        setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setNotifications(notifSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setAiChats(aiSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to load subcollections", e);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [user.id]);

  const handlePasswordReset = async () => {
    if (!user.email) return alert("User has no email");
    if (confirm(`Send password reset email to ${user.email}?`)) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        alert("Password reset email sent!");
      } catch (error) {
        alert("Failed to send reset email: " + error);
      }
    }
  };

  const handleSoftDelete = async () => {
    if (confirm(`Are you sure you want to permanently soft-delete ${user.email}? This will instantly log them out and destroy their access.`)) {
      try {
        await setDoc(doc(db, 'users', user.id), { isDeleted: true }, { merge: true });
        alert("User account has been deleted.");
        onUserUpdated({ ...user, isDeleted: true });
      } catch (error) {
        alert("Failed to delete user: " + error);
      }
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      
      // Title
      doc.setFontSize(20);
      doc.text("Vulnerability Report", pageWidth / 2, 20, { align: "center" });
      
      // Basic Info
      doc.setFontSize(12);
      doc.text(`User: ${user.email}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 37);
      
      let startY = 47;
      if (user.deviceInfo) {
        doc.text(`Device: ${user.deviceInfo.deviceName} (${user.deviceInfo.deviceModel})`, 14, startY);
        doc.text(`OS Version: ${user.deviceInfo.osVersion}`, 14, startY + 7);
        startY += 17;
      }

      // Threat History Table
      if (logs.length > 0) {
        doc.setFontSize(14);
        doc.text("Threat History", 14, startY);
        startY += 5;
        
        const tableBody = logs.flatMap(log => {
          const dateStr = new Date(log.timestamp).toLocaleString();
          const threats = (log.checks || []).filter((c:any) => c.status !== 'secure');
          
          if (threats.length === 0) {
            return [[dateStr, log.overallStatus.toUpperCase(), "No active threats"]];
          }
          
          return threats.map((c:any, index:number) => [
            index === 0 ? dateStr : "", 
            index === 0 ? log.overallStatus.toUpperCase() : "", 
            `${c.name}: ${c.message}`
          ]);
        });
        
        autoTable(doc, {
          startY: startY,
          head: [['Date', 'Status', 'Findings']],
          body: tableBody,
          styles: { fontSize: 10 },
          headStyles: { fillColor: [99, 102, 241] }, // --accent-color
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      } else {
        doc.text("No threat history found for this user.", 14, startY);
      }
      
      doc.save(`${user.email}_vulnerability_report.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF report.");
    }
  };

  return (
    <div className="animate-in" style={{ paddingBottom: '2rem' }}>
      <button className="btn" onClick={onClose} style={{ marginBottom: '1rem', background: 'transparent', border: '1px solid var(--border-color)' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>

      <div className="glass-panel" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0' }}>{user.email}</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>ID: {user.id}</p>
          {user.isDeleted && <span className="badge" style={{ backgroundColor: '#ef4444', marginTop: '0.5rem', display: 'inline-block' }}>Deleted Account</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={handleExportPDF} style={{ background: 'var(--success-color)' }}>
            <Download size={16} /> Export PDF Report
          </button>
          <button className="btn" onClick={handlePasswordReset} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
            <Key size={16} /> Reset Password
          </button>
          <button className="btn" onClick={handleSoftDelete} disabled={user.isDeleted} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
        {(['overview', 'threats', 'notifications', 'ai'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-color)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontWeight: 600
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ minHeight: '400px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading user data...</p>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div>
                <h3>Device Information</h3>
                {user.deviceInfo ? (
                  <ul style={{ listStyle: 'none', padding: 0, gap: '0.5rem', display: 'grid' }}>
                    <li style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}><strong>Device Name:</strong> {user.deviceInfo.deviceName}</li>
                    <li style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}><strong>Model:</strong> {user.deviceInfo.deviceModel}</li>
                    <li style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}><strong>OS:</strong> {user.deviceInfo.osVersion}</li>
                    <li style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}><strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Unknown'}</li>
                  </ul>
                ) : (
                  <p style={{ color: 'var(--text-muted)' }}>No device info synced yet.</p>
                )}
              </div>
            )}

            {activeTab === 'threats' && (
              <div>
                <h3>Threat History</h3>
                {logs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No logs found.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {logs.map(log => (
                      <li key={log.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <strong>{new Date(log.timestamp).toLocaleString()}</strong>
                          <span style={{ color: log.overallStatus === 'secure' ? '#10b981' : log.overallStatus === 'warning' ? '#f59e0b' : '#ef4444' }}>
                            {log.overallStatus.toUpperCase()}
                          </span>
                        </div>
                        {log.checks && log.checks.filter((c:any) => c.status !== 'secure').map((c:any) => (
                          <div key={c.id} style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>- {c.name}: {c.message}</div>
                        ))}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h3>Notifications Sent</h3>
                {notifications.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No notifications found.</p> : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {notifications.map(n => (
                      <li key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{new Date(n.timestamp).toLocaleString()}</div>
                        <strong>{n.title}</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>{n.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'ai' && (
              <div>
                <h3>AI Conversation Transcript</h3>
                {aiChats.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No AI conversations found.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {aiChats.map(chat => (
                      <div key={chat.id} style={{ 
                        alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        padding: '1rem',
                        borderRadius: '8px',
                        background: chat.role === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                        color: '#fff'
                      }}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '0.25rem' }}>
                          {chat.role.toUpperCase()} - {new Date(chat.timestamp).toLocaleString()}
                        </div>
                        <div>{chat.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
