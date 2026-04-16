import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { vendorAPI, orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

const statCard = (bg, icon, label, value) => (
  <motion.div whileHover={{ y: -3 }}
    style={{
      background: bg, borderRadius: 'var(--radius-lg)', padding: '1.25rem',
      color: '#fff', display: 'flex', alignItems: 'center', gap: '1rem',
    }}
  >
    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>{label}</p>
      <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>{value}</p>
    </div>
  </motion.div>
);

export default function VendorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDash(); }, []);

  const loadDash = async () => {
    try {
      const { data } = await vendorAPI.getDashboard();
      setDashboard(data);
      setIsOpen(data.vendor?.isOpen || false);
    } catch {
      // fallback
    }
    setLoading(false);
  };

  const toggleShop = async () => {
    try {
      const { data } = await vendorAPI.toggleShop();
      setIsOpen(data.isOpen);
      toast.success(data.isOpen ? 'Shop is now OPEN! 🟢' : 'Shop closed 🔴');
    } catch {
      toast.error('Failed to toggle');
    }
  };

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  const stats = dashboard || {};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DashboardIcon style={{ color: 'var(--primary)' }} /> Vendor Dashboard
        </h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={toggleShop}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: isOpen ? 'var(--secondary)' : 'var(--danger)',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
          }}>
          {isOpen ? <><ToggleOnIcon /> Shop Open</> : <><ToggleOffIcon /> Shop Closed</>}
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCard('var(--gradient-1)', <InventoryIcon />, 'Total Products', stats.totalProducts || 0)}
        {statCard('var(--gradient-2)', <AttachMoneyIcon />, 'Revenue', `₹${stats.revenue?.toFixed(0) || 0}`)}
        {statCard('var(--gradient-3)', <PendingActionsIcon />, 'Pending Orders', stats.pendingOrders || 0)}
        {statCard('linear-gradient(135deg, #6366F1, #8B5CF6)', <TrendingUpIcon />, 'Total Orders', stats.totalOrders || 0)}
      </div>

      {/* Recent Orders */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Orders</h2>
      {(stats.recentOrders || []).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {stats.recentOrders.map(order => (
            <div key={order._id} style={{
              background: '#fff', borderRadius: 'var(--radius)', padding: '1rem',
              boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
            }}>
              <div>
                <p style={{ fontWeight: 600 }}>#{order.orderNumber || order._id?.slice(-6)}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{order.items?.length} items</p>
              </div>
              <span className={`status-${order.orderStatus}`} style={{ padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                {order.orderStatus?.replace('_', ' ')}
              </span>
              <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>₹{order.total?.toFixed(0)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
          <p>No orders yet</p>
        </div>
      )}
    </div>
  );
}
