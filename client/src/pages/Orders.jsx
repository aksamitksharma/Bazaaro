import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ReviewForm from '../components/common/ReviewForm';

const statusColors = {
  placed: '#3B82F6', confirmed: '#6366F1', preparing: '#D97706', ready: '#059669',
  picked: '#0891B2', on_the_way: '#EAB308', delivered: '#16A34A', cancelled: '#DC2626',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await orderAPI.getAll();
      setOrders(data.orders || []);
    } catch { }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
      {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />)}
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ReceiptLongIcon style={{ color: 'var(--primary)' }} /> My Orders
      </h1>

      {orders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 700 }}>
          {orders.map((order, i) => (
            <motion.div key={order._id} initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                boxShadow: 'var(--shadow)', borderLeft: `4px solid ${statusColors[order.orderStatus] || 'var(--border)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Order #{order.orderNumber || order._id?.slice(-6)}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AccessTimeIcon style={{ fontSize: '0.8rem' }} />
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`status-${order.orderStatus}`}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
                  {(order.orderStatus || 'placed').replace('_', ' ')}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.5rem' }}>
                {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} • ₹{order.total?.toFixed(0)}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                {!['delivered', 'cancelled'].includes(order.orderStatus) && (
                  <Link to={`/orders/${order._id}/track`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.8rem', fontWeight: 600, color: '#fff',
                      background: 'var(--primary)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)'
                    }}>
                    <LocalShippingIcon style={{ fontSize: '0.9rem' }} /> Track Order
                  </Link>
                )}
                {order.orderStatus === 'delivered' && !order.isReviewed && (
                  <button 
                    onClick={() => setReviewOrder(reviewOrder === order._id ? null : order._id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.25rem',
                      fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)',
                      background: '#FFFBEB', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius)',
                      border: '1px solid #FDE68A', cursor: 'pointer'
                    }}>
                    <RateReviewIcon style={{ fontSize: '0.9rem' }} /> 
                    {reviewOrder === order._id ? 'Cancel Review' : 'Leave Review'}
                  </button>
                )}
              </div>
              
              {reviewOrder === order._id && (
                <div style={{ marginTop: '1.25rem' }}>
                  <ReviewForm 
                    vendorId={order.vendorId?._id || order.vendorId} 
                    orderId={order._id}
                    onReviewSubmitted={() => {
                        setReviewOrder(null);
                        setOrders(orders.map(o => o._id === order._id ? {...o, isReviewed: true} : o));
                    }} 
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center', padding: '4rem', background: 'var(--surface-2)',
          borderRadius: 'var(--radius-lg)', color: 'var(--text-3)',
        }}>
          <ReceiptLongIcon style={{ fontSize: '3.5rem', opacity: 0.2, marginBottom: '0.5rem' }} />
          <p style={{ fontWeight: 600 }}>No orders yet</p>
          <p style={{ fontSize: '0.85rem' }}>Start shopping from nearby vendors!</p>
        </div>
      )}
    </div>
  );
}
