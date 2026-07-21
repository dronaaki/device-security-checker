import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, AlertTriangle, Database } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { db } from '../firebase';

export function AccountingDashboard() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  
  // KPIs
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [mrr, setMrr] = useState(0);
  const [activeSubs, setActiveSubs] = useState(0);
  const [churnRate, setChurnRate] = useState(0);
  
  // Chart Data
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch up to 1000 recent transactions
        const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(1000));
        const snapshot = await getDocs(q);
        const txns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(txns);

        calculateMetrics(txns);
      } catch (err) {
        console.error("Failed to load transactions", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const calculateMetrics = (txns: any[]) => {
    let revenue = 0;
    let currentMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let failedCount = 0;
    let totalCount = 0;
    
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const monthlyRevenue = new Map<string, number>();

    const activeUserSet = new Set();

    txns.forEach(t => {
      const date = new Date(t.timestamp);
      
      // Churn calculation (failed/refunded vs success)
      totalCount++;
      if (t.status === 'failed' || t.status === 'refunded') {
        failedCount++;
      } else if (t.status === 'success') {
        // Add to total revenue
        revenue += t.amount || 0;
        
        // Add to monthly chart
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + (t.amount || 0));

        // Calculate MRR and Active Subs (approximation: anyone who paid in the last 30 days)
        if (date >= lastMonthStart && date < currentMonthStart) {
            lastMonthRevenue += t.amount || 0;
        }
        if (date >= currentMonthStart) {
            currentMonthRevenue += t.amount || 0;
            activeUserSet.add(t.userId);
        } else if (now.getTime() - date.getTime() <= 30 * 24 * 60 * 60 * 1000) {
            // Also count them as active if they paid in the rolling 30 days
            activeUserSet.add(t.userId);
        }
      }
    });

    setTotalRevenue(revenue);
    
    // Smooth out MRR (if we are mid-month, current month might be low, so use last full month as baseline + current)
    // For this dashboard, we will just use the rolling 30 day revenue approximation.
    let rolling30DayRevenue = 0;
    txns.forEach(t => {
      if (t.status === 'success') {
        const date = new Date(t.timestamp);
        if (now.getTime() - date.getTime() <= 30 * 24 * 60 * 60 * 1000) {
          rolling30DayRevenue += t.amount || 0;
        }
      }
    });
    setMrr(rolling30DayRevenue);
    setActiveSubs(activeUserSet.size);
    setChurnRate(totalCount > 0 ? (failedCount / totalCount) * 100 : 0);

    // Prepare chart data (sort chronologically)
    const sortedMonths = Array.from(monthlyRevenue.keys()).sort();
    const chartData = sortedMonths.map(month => ({
      name: month,
      revenue: parseFloat(monthlyRevenue.get(month)!.toFixed(2))
    }));
    setRevenueData(chartData);
  };

  const generateMockTransactions = async () => {
    setLoading(true);
    const PLANS = [
      { id: 'pro', price: 9.99, weight: 0.7 },
      { id: 'max', price: 19.99, weight: 0.3 }
    ];

    const PROVIDERS = ['stripe', 'paypal'];
    const STATUSES = [
      { status: 'success', weight: 0.85 },
      { status: 'failed', weight: 0.10 },
      { status: 'refunded', weight: 0.05 }
    ];

    function weightedRandom(items: any[]) {
      const rand = Math.random();
      let cumulative = 0;
      for (const item of items) {
        cumulative += item.weight;
        if (rand < cumulative) return item;
      }
      return items[items.length - 1];
    }

    const now = new Date();
    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * 180);
      const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      const plan = weightedRandom(PLANS);
      const statusObj = weightedRandom(STATUSES);
      const provider = PROVIDERS[Math.floor(Math.random() * PROVIDERS.length)];
      
      const transaction = {
        userId: `user_mock_${Math.floor(Math.random() * 1000)}`,
        userEmail: `user${Math.floor(Math.random() * 1000)}@example.com`,
        amount: plan.price,
        currency: 'USD',
        status: statusObj.status,
        provider: provider,
        planId: plan.id,
        timestamp: date.toISOString(),
        transactionId: `txn_${Math.random().toString(36).substring(2, 15)}`
      };

      try {
        await addDoc(collection(db, 'transactions'), transaction);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
    window.location.reload();
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading accounting data...</div>;
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <DollarSign color="#10b981" size={28} />
        <h2 style={{ margin: 0 }}>Accounting & Finance</h2>
      </div>

      {/* KPI Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <TrendingUp size={16} color="#10b981" />
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Monthly Recurring Revenue</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            ${mrr.toFixed(2)}
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <DollarSign size={16} color="#3b82f6" />
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Total Revenue (All-time)</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            ${totalRevenue.toFixed(2)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <Users size={16} color="#8b5cf6" />
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Active Paid Subs</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            {activeSubs}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <AlertTriangle size={16} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>Estimated Churn Rate</h3>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: churnRate > 10 ? '#ef4444' : 'var(--text-main)' }}>
            {churnRate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Revenue Chart */}
        <div className="glass-panel">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Revenue Trend</h3>
          <div style={{ height: '300px', width: '100%' }}>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: '8px' }} 
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No revenue data available.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)' }}>Recent Transactions</h3>
          <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
            {transactions.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No transactions found.</p>
                <button onClick={generateMockTransactions} className="btn">
                  <Database size={16} /> Generate Mock Transactions
                </button>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {transactions.slice(0, 15).map(txn => (
                  <li key={txn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--text-main)' }}>{txn.userEmail || txn.userId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(txn.timestamp).toLocaleString()} • {txn.provider?.toUpperCase()} • {txn.planId?.toUpperCase()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: txn.status === 'success' ? '#10b981' : txn.status === 'refunded' ? '#f59e0b' : '#ef4444' }}>
                        {txn.status === 'refunded' ? '-' : ''}${txn.amount?.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
                        {txn.status}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
