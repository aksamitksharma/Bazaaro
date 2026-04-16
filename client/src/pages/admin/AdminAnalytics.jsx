import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const s = {
  title: { fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem', marginBottom: '2rem',
  },
  statCard: {
    background: '#fff', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow)', padding: '1.25rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
  },
  statIcon: {
    width: 48, height: 48, borderRadius: 'var(--radius)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  chartSection: {
    background: '#fff', borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow)', padding: '1.5rem', marginBottom: '1.5rem',
  },
  chartTitle: {
    fontFamily: 'Poppins', fontSize: '1rem', fontWeight: 700,
    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
  },
  barContainer: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  barRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  barLabel: { fontSize: '0.78rem', color: 'var(--text-2)', width: 100, textAlign: 'right', flexShrink: 0 },
  bar: { height: 28, borderRadius: 'var(--radius)', transition: '0.5s', position: 'relative' },
  barValue: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
    fontSize: '0.72rem', fontWeight: 700, color: '#fff',
  },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  listItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0.6rem 0', borderBottom: '1px solid var(--surface-2)',
    fontSize: '0.88rem',
  },
};

const colors = ['#4338CA', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#EA580C', '#4F46E5'];

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const [dashRes, analyticsRes] = await Promise.allSettled([
        adminAPI.getDashboard(),
        adminAPI.getAnalytics(),
      ]);
      const dashData = dashRes.status === 'fulfilled' ? dashRes.value.data : {};
      const analyticsData = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : {};
      setStats({ ...dashData, ...analyticsData });
    } catch {}
    setLoading(false);
  };

  if (loading) return (
    <div>
      <h1 style={s.title}>📊 Analytics</h1>
      <div style={s.statsGrid}>
        {[1, 2, 3, 4].map(i => <div key={i} className="shimmer" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
      </div>
      <div className="shimmer" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
    </div>
  );

  const summaryCards = [
    { icon: <PeopleIcon />, label: 'Total Users', value: stats?.totalUsers || 0, color: '#4338CA', bg: '#EEF2FF' },
    { icon: <StorefrontIcon />, label: 'Active Vendors', value: stats?.totalVendors || 0, color: '#059669', bg: '#D1FAE5' },
    { icon: <ShoppingBagIcon />, label: 'Total Orders', value: stats?.totalOrders || 0, color: '#D97706', bg: '#FEF3C7' },
    { icon: <CurrencyRupeeIcon />, label: 'Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, color: '#DC2626', bg: '#FEE2E2' },
    { icon: <LocalShippingIcon />, label: 'Deliveries', value: stats?.totalDeliveries || 0, color: '#7C3AED', bg: '#EDE9FE' },
  ];

  // Build chart data from available stats
  const orderStatusData = stats?.orderStatusBreakdown || [];
  const maxOrders = Math.max(...orderStatusData.map(o => o.count || 0), 1);

  const topVendors = stats?.topVendors || [];
  const recentActivity = stats?.recentOrders || [];

  return (
    <div>
      <h1 style={s.title}>📊 Platform Analytics</h1>

      {/* Summary Stats */}
      <div style={s.statsGrid}>
        {summaryCards.map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }} whileHover={{ y: -3 }} style={s.statCard}
          >
            <div style={{ ...s.statIcon, background: c.bg, color: c.color }}>
              {c.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.3rem', fontWeight: 800, color: c.color }}>{c.value}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{c.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ ...s.grid2, gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr' }}>
        {/* Order Status Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }} style={s.chartSection}
        >
          <h3 style={s.chartTitle}>
            <AnalyticsIcon style={{ color: 'var(--primary)' }} /> Order Status Distribution
          </h3>
          {orderStatusData.length > 0 ? (
            <div style={s.barContainer}>
              {orderStatusData.map((item, i) => (
                <div key={item._id} style={s.barRow}>
                  <span style={s.barLabel}>{item._id}</span>
                  <div style={{ flex: 1 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / maxOrders) * 100}%` }}
                      transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
                      style={{ ...s.bar, background: colors[i % colors.length], minWidth: 40 }}
                    >
                      <span style={s.barValue}>{item.count}</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '2rem' }}>No order data yet</p>
          )}
        </motion.div>

        {/* Top Vendors or Recent Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }} style={s.chartSection}
        >
          <h3 style={s.chartTitle}>
            <TrendingUpIcon style={{ color: 'var(--secondary)' }} /> Recent Activity
          </h3>
          {recentActivity.length > 0 ? (
            <div>
              {recentActivity.slice(0, 8).map((order, i) => (
                <div key={order._id || i} style={s.listItem}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      #{order.orderNumber || order._id?.slice(-6)}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.9rem' }}>
                      ₹{order.total || 0}
                    </p>
                    <span className={`status-${order.orderStatus}`} style={{
                      padding: '0.15rem 0.5rem', borderRadius: 999,
                      fontSize: '0.65rem', fontWeight: 700,
                    }}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-3)', textAlign: 'center', padding: '2rem' }}>No recent activity</p>
          )}
        </motion.div>
      </div>

      {/* Monthly Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }} style={s.chartSection}
      >
        <h3 style={s.chartTitle}>
          <CurrencyRupeeIcon style={{ color: 'var(--accent)' }} /> Revenue Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Today</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--secondary)' }}>
              ₹{(stats?.todayRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>This Week</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
              ₹{(stats?.weekRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>This Month</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)' }}>
              ₹{(stats?.monthRevenue || 0).toLocaleString()}
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--surface-2)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>All Time</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626' }}>
              ₹{(stats?.totalRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
