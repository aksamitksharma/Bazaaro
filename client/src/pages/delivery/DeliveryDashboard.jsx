import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { deliveryAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export default function DeliveryDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [dashRes, ordersRes] = await Promise.allSettled([
        deliveryAPI.getDashboard(),
        deliveryAPI.getOrders(),
      ]);
      if (dashRes.status === 'fulfilled') {
        setDashboard(dashRes.value.data);
        setIsOnline(dashRes.value.data?.isOnline || false);
      }
      if (ordersRes.status === 'fulfilled') setOrders(ordersRes.value.data.orders || []);
    } catch { }
    setLoading(false);
  };

  const toggleOnline = async () => {
    try {
      const { data } = await deliveryAPI.toggle();
      setIsOnline(data.isOnline);
      toast.success(data.isOnline ? 'You are ONLINE 🟢' : 'You are OFFLINE 🔴');
    } catch {
      toast.error('Toggle failed');
    }
  };

  const acceptOrder = async (id) => {
    try {
      await deliveryAPI.acceptOrder(id);
      toast.success('Order accepted! 🚀');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Accept failed');
    }
  };

  const updateDeliveryStatus = async (id, status) => {
    try {
      await deliveryAPI.updateStatus(id, { status });
      toast.success(`Status → ${status}`);
      loadData();
    } catch {
      toast.error('Update failed');
    }
  };

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TwoWheelerIcon style={{ color: 'var(--primary)' }} /> Delivery Dashboard
        </h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={toggleOnline}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: isOnline ? 'var(--secondary)' : '#6B7280',
            color: '#fff', fontWeight: 700, fontSize: '0.9rem',
          }}>
          {isOnline ? <><ToggleOnIcon /> Online</> : <><ToggleOffIcon /> Offline</>}
        </motion.button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <motion.div whileHover={{ y: -3 }} style={{ background: 'var(--gradient-1)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', color: '#fff' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>Total Deliveries</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>{dashboard?.totalDeliveries || 0}</p>
        </motion.div>
        <motion.div whileHover={{ y: -3 }} style={{ background: 'var(--gradient-2)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', color: '#fff' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>Earnings</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>₹{dashboard?.earnings?.toFixed(0) || 0}</p>
        </motion.div>
        <motion.div whileHover={{ y: -3 }} style={{ background: 'var(--gradient-3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', color: '#fff' }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>Assigned Orders</p>
          <p style={{ fontSize: '1.4rem', fontWeight: 800 }}>{orders.length}</p>
        </motion.div>
      </div>

      {/* Available Pending Orders (Smart Pool) */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AutoAwesomeIcon style={{ color: '#FCD34D' }} /> Available Smart Route Batches
      </h2>
      {(dashboard?.pendingOrders || []).length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
          {dashboard.pendingOrders.map(order => (
            <div key={order._id} style={{
              background: order.isPool ? 'linear-gradient(135deg, #10B98122, #34D39922)' : '#fff', 
              borderRadius: 'var(--radius-lg)', padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)', border: order.isPool ? '2px solid #10B981' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: 700, color: order.isPool ? '#047857' : 'inherit' }}>
                    {order.orderNumber || order._id?.slice(-6)}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                    Extracted from {order.vendorId?.shopName}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <p style={{ fontWeight: 800, color: 'var(--secondary)' }}>Earn ₹{order.deliveryCharge}</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                   try {
                      if(order.isPool) {
                         for(const cid of order.orders) await deliveryAPI.acceptOrder(cid);
                      } else {
                         await deliveryAPI.acceptOrder(order._id);
                      }
                      toast.success('Batch Accepted Successfully!');
                      loadData();
                   } catch { toast.error('Failed to accept order(s)'); }
                }}
                style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem', borderRadius: 'var(--radius)', border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Accept {order.isPool ? 'Batch' : 'Delivery'}
              </button>
            </div>
          ))}
        </div>
      ) : (
         <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center', color: 'var(--text-3)', marginBottom: '2rem' }}>
           <p style={{ fontWeight: 600 }}>No available orders right now.</p>
         </div>
      )}

      {/* Assigned Orders */}
      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AssignmentIcon style={{ color: 'var(--accent)' }} /> Assigned Orders
      </h2>
      {orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orders.map(order => (
            <div key={order._id} style={{
              background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.25rem',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: 700 }}>#{order.orderNumber || order._id?.slice(-6)}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>{order.items?.length} items • ₹{order.total?.toFixed(0)}</p>
                </div>
                <span className={`status-${order.orderStatus}`} style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                  {order.orderStatus?.replace('_', ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                {order.orderStatus === 'ready' && (
                  <button onClick={() => updateDeliveryStatus(order._id, 'picked')}
                    style={{ padding: '0.4rem 0.85rem', borderRadius: 999, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    📦 Pick Up
                  </button>
                )}
                {order.orderStatus === 'picked' && (
                  <button onClick={() => updateDeliveryStatus(order._id, 'on_the_way')}
                    style={{ padding: '0.4rem 0.85rem', borderRadius: 999, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    🚀 On the Way
                  </button>
                )}
                {order.orderStatus === 'on_the_way' && (
                  <button onClick={() => updateDeliveryStatus(order._id, 'delivered')}
                    style={{ padding: '0.4rem 0.85rem', borderRadius: 999, border: 'none', background: 'var(--secondary)', color: '#fff', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                    <CheckCircleIcon style={{ fontSize: '0.9rem', verticalAlign: 'middle' }} /> Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-lg)', padding: '3rem', textAlign: 'center', color: 'var(--text-3)' }}>
          <LocalShippingIcon style={{ fontSize: '3rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>No assigned orders</p>
        </div>
      )}
    </div>
  );
}
