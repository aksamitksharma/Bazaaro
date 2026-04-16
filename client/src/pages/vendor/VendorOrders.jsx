import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const statusFlow = { placed: 'confirmed', confirmed: 'preparing', preparing: 'ready' };

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const { data } = await orderAPI.getAll();
      setOrders(data.orders || []);
    } catch { }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, { orderStatus: status });
      toast.success(`Order → ${status}`);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);

  const filters = ['all', 'placed', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ReceiptLongIcon style={{ color: 'var(--primary)' }} /> Orders
      </h1>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '0.4rem 0.85rem', borderRadius: 999, border: 'none', fontSize: '0.8rem',
              fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              background: filter === f ? 'var(--primary)' : 'var(--surface-2)',
              color: filter === f ? '#fff' : 'var(--text-2)',
              transition: '0.15s',
            }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((order, i) => (
            <motion.div key={order._id} initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: 700 }}>#{order.orderNumber || order._id?.slice(-6)}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                    {order.items?.length} items • {new Date(order.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className={`status-${order.orderStatus}`} style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                    {order.orderStatus?.replace('_', ' ')}
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>₹{order.total?.toFixed(0)}</span>
                </div>
              </div>

              {statusFlow[order.orderStatus] && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => updateStatus(order._id, statusFlow[order.orderStatus])}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      padding: '0.4rem 0.85rem', border: 'none', borderRadius: 999,
                      background: 'var(--secondary)', color: '#fff', fontSize: '0.8rem',
                      fontWeight: 600, cursor: 'pointer',
                    }}>
                    <CheckCircleIcon style={{ fontSize: '0.9rem' }} /> {statusFlow[order.orderStatus]}
                  </motion.button>
                  {order.orderStatus === 'placed' && (
                    <button onClick={() => updateStatus(order._id, 'cancelled')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        padding: '0.4rem 0.85rem', border: '1.5px solid var(--danger)', borderRadius: 999,
                        background: 'transparent', color: 'var(--danger)', fontSize: '0.8rem',
                        fontWeight: 600, cursor: 'pointer',
                      }}>
                      <CancelIcon style={{ fontSize: '0.9rem' }} /> Reject
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
          <p style={{ fontWeight: 600 }}>No orders found</p>
        </div>
      )}
    </div>
  );
}
