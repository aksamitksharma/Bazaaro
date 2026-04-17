import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const [ordersRes, dpRes] = await Promise.all([
        adminAPI.getOrders(),
        adminAPI.getDeliveryPartners()
      ]);
      setOrders(ordersRes.data.orders || []);
      setDeliveryPartners(dpRes.data.partners || []);
    } catch { }
    setLoading(false);
  };

  const handleAssignDelivery = async (orderId, dpId) => {
    if (!dpId) return;
    try {
      await adminAPI.assignDelivery({ orderId, deliveryPartnerId: dpId });
      toast.success('Delivery assigned successfully!');
      loadOrders();
    } catch {
      toast.error('Failed to assign delivery');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ReceiptLongIcon style={{ color: 'var(--primary)' }} /> All Orders
      </h1>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 'var(--radius)' }} />)}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 1fr 0.8fr 0.6fr',
            padding: '0.85rem 1.25rem', background: 'var(--surface-2)',
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span>Order #</span><span>Customer</span><span>Status</span><span>Delivery</span><span>Total</span><span>Date</span>
          </div>
          {orders.map((o, i) => (
            <motion.div key={o._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 1fr 0.8fr 0.6fr',
                padding: '0.85rem 1.25rem', alignItems: 'center',
                borderBottom: '1px solid var(--border)', fontSize: '0.85rem',
              }}>
              <span style={{ fontWeight: 600 }}>#{o.orderNumber || o._id?.slice(-6)}</span>
              <span style={{ color: 'var(--text-2)' }}>{o.customerId?.name || '—'}</span>
              <span className={`status-${o.orderStatus}`} style={{
                display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: 999,
                fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize', width: 'fit-content',
              }}>
                {o.orderStatus?.replace('_', ' ')}
              </span>
              
              <span style={{ fontSize: '0.8rem' }}>
                {o.deliveryPartnerId ? (
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Assigned</span>
                ) : o.orderStatus === 'ready' ? (
                  <select 
                    onChange={(e) => handleAssignDelivery(o._id, e.target.value)}
                    defaultValue=""
                    style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)' }}
                  >
                    <option value="" disabled>Assign...</option>
                    {deliveryPartners.map(dp => (
                      <option key={dp._id} value={dp._id}>{dp.userId?.name || 'Partner'}</option>
                    ))}
                  </select>
                ) : (
                  <span style={{ color: 'var(--text-3)' }}>—</span>
                )}
              </span>

              <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>₹{o.total?.toFixed(0)}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </motion.div>
          ))}
          {orders.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>No orders found</div>
          )}
        </div>
      )}
    </div>
  );
}
