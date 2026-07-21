import { TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsDashboardProps {
  subscribers: any[];
  incidents: any[];
  timeFilter: 'week' | 'month' | 'quarter' | 'semi-annual' | 'year' | 'all';
  setTimeFilter: (v: 'week' | 'month' | 'quarter' | 'semi-annual' | 'year' | 'all') => void;
}

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#64748b'];

export function AnalyticsDashboard({ subscribers, incidents, timeFilter, setTimeFilter }: AnalyticsDashboardProps) {
  const totalSubscribers = subscribers.length;
  const now = new Date();
  let cutoffDate = new Date(0);
  let periodLabel = 'All Time';

  switch (timeFilter) {
    case 'week':
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      periodLabel = 'Last 7 Days';
      break;
    case 'month':
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      periodLabel = 'Last 30 Days';
      break;
    case 'quarter':
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      periodLabel = 'Last 3 Months';
      break;
    case 'semi-annual':
      cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      periodLabel = 'Last 6 Months';
      break;
    case 'year':
      cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      periodLabel = 'Last Year';
      break;
    case 'all':
    default:
      cutoffDate = new Date(0);
      periodLabel = 'All Time';
      break;
  }

  const filteredSubscribers = subscribers.filter(s => s.createdAt && new Date(s.createdAt) >= cutoffDate);
  const newSubscribers = filteredSubscribers.length;
  const activeAdmins = subscribers.filter(s => s.isAdmin && (!s.accessExpiresAtMillis || Date.now() < s.accessExpiresAtMillis)).length;

  const growthMap = new Map<string, number>();
  let initialCount = subscribers.filter(s => s.createdAt && new Date(s.createdAt) < cutoffDate).length;

  filteredSubscribers.forEach(s => {
    if (s.createdAt) {
      const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
      growthMap.set(dateStr, (growthMap.get(dateStr) || 0) + 1);
    }
  });
  
  const sortedDates = Array.from(growthMap.keys()).sort();
  let cumulative = initialCount;
  const growthData = sortedDates.map(date => {
    cumulative += growthMap.get(date)!;
    return { date, count: cumulative };
  });

  if (growthData.length === 0 && timeFilter !== 'all') {
     growthData.push({ date: cutoffDate.toISOString().split('T')[0], count: initialCount });
     growthData.push({ date: now.toISOString().split('T')[0], count: initialCount });
  }

  const rolesMap = new Map<string, number>();
  subscribers.forEach(s => {
    const roleName = s.role ? s.role : (s.isAdmin ? 'Admin' : 'User');
    rolesMap.set(roleName, (rolesMap.get(roleName) || 0) + 1);
  });
  const rolesData = Array.from(rolesMap.entries()).map(([name, value]) => ({ name, value }));

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>Marketing & Analytics</h2>
        <select 
          className="input-field" 
          style={{ width: 'auto', margin: 0, padding: '0.25rem 0.5rem', background: 'var(--bg-panel)' }}
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as any)}
        >
          <option value="all">All Time</option>
          <option value="week">1 Week</option>
          <option value="month">1 Month</option>
          <option value="quarter">1 Quarter (3 Months)</option>
          <option value="semi-annual">Semi-Annual (6 Months)</option>
          <option value="year">1 Year</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Total Subscribers</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{totalSubscribers}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Signups ({periodLabel})</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{newSubscribers}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>Active Admins</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>{activeAdmins}</div>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)' }}>AI Incidents (Recent)</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: incidents.length > 0 ? '#ef4444' : '#10b981' }}>{incidents.length}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp color="var(--accent-color)" />
            <h3 style={{ margin: 0 }}>Subscriber Growth</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                  itemStyle={{ color: 'var(--text-color)' }}
                />
                <Line type="monotone" dataKey="count" stroke="var(--accent-color)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <PieChartIcon color="var(--accent-color)" />
            <h3 style={{ margin: 0 }}>Roles Distribution</h3>
          </div>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rolesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {rolesData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-color)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
