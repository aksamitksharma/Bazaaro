import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const { data } = await adminAPI.getDashboard();
      setStats(data);
    } catch { }
    setLoading(false);
  };

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, bg: 'var(--gradient-1)', icon: <PeopleIcon /> },
    { label: 'Total Vendors', value: stats?.totalVendors || 0, bg: 'var(--gradient-2)', icon: <StorefrontIcon /> },
    { label: 'Total Orders', value: stats?.totalOrders || 0, bg: 'var(--gradient-3)', icon: <ReceiptLongIcon /> },
    { label: 'Revenue', value: `₹${(stats?.revenue || 0).toFixed(0)}`, bg: 'linear-gradient(135deg, #6366F1, #8B5CF6)', icon: <AttachMoneyIcon /> },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AdminPanelSettingsIcon style={{ color: 'var(--primary)' }} /> Admin Dashboard
      </h1>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {cards.map(c => (
              <motion.div key={c.label} whileHover={{ y: -4 }}
                style={{
                  background: c.bg, borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                  color: '#fff', display: 'flex', alignItems: 'center', gap: '1rem',
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.icon}
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', opacity: 0.85 }}>{c.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{c.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity placeholder */}
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUpIcon style={{ color: 'var(--accent)' }} /> Platform Overview
          </h2>
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-lg)', padding: '2rem',
            boxShadow: 'var(--shadow)', textAlign: 'center', color: 'var(--text-3)',
          }}>
            <p style={{ fontWeight: 600 }}>Analytics charts coming in Phase 6</p>
            <p style={{ fontSize: '0.85rem' }}>Navigate to Users, Vendors, or Orders for management</p>
          </div>
        </>
      )}
    </div>
  );
}
