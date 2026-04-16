import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

const steps = ['placed', 'confirmed', 'preparing', 'ready', 'picked', 'on_the_way', 'delivered'];
const stepLabels = { placed: 'Order Placed', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready', picked: 'Picked Up', on_the_way: 'On the Way', delivered: 'Delivered' };

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      const { data } = await orderAPI.getOne(id);
      setOrder(data.order);
    } catch {
      toast.error('Order not found');
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ padding: '2rem' }}>
      <div className="shimmer" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
    </div>
  );

  if (!order) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)' }}>
      <LocalShippingIcon style={{ fontSize: '4rem', opacity: 0.3 }} />
      <p style={{ fontWeight: 600, marginTop: '1rem' }}>Order not found</p>
    </div>
  );

  const currentStep = steps.indexOf(order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LocalShippingIcon style={{ color: 'var(--primary)' }} /> Track Order
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: '2rem' }}>
          #{order.orderNumber || order._id?.slice(-6)}
        </p>
      </motion.div>

      {isCancelled ? (
        <div style={{
          background: '#FEE2E2', borderRadius: 'var(--radius-lg)', padding: '2rem',
          textAlign: 'center', color: '#991B1B',
        }}>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Order Cancelled</p>
          {order.cancelReason && <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{order.cancelReason}</p>}
        </div>
      ) : (
        <div style={{
          background: '#fff', borderRadius: 'var(--radius-lg)', padding: '2rem',
          boxShadow: 'var(--shadow)',
        }}>
          {steps.map((step, i) => {
            const done = i <= currentStep;
            const active = i === currentStep;
            return (
              <div key={step} style={{ display: 'flex', gap: '1rem', marginBottom: i < steps.length - 1 ? '0.5rem' : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <motion.div initial={false}
                    animate={{ scale: active ? 1.2 : 1 }}
                    style={{ color: done ? 'var(--secondary)' : 'var(--text-3)' }}>
                    {done ?
                      <CheckCircleIcon style={{ fontSize: '1.5rem' }} /> :
                      <RadioButtonUncheckedIcon style={{ fontSize: '1.5rem' }} />
                    }
                  </motion.div>
                  {i < steps.length - 1 && (
                    <div style={{
                      width: 2, height: 32,
                      background: done ? 'var(--secondary)' : 'var(--border)',
                      transition: '0.3s',
                    }} />
                  )}
                </div>
                <div style={{ paddingTop: '0.15rem' }}>
                  <p style={{
                    fontWeight: done ? 700 : 400, fontSize: '0.9rem',
                    color: done ? 'var(--text)' : 'var(--text-3)',
                  }}>
                    {stepLabels[step]}
                  </p>
                  {active && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                      Current status
                    </motion.p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details */}
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        boxShadow: 'var(--shadow)', marginTop: '1.5rem',
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Items</h3>
        {order.items?.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem',
            marginBottom: '0.5rem', borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none',
            fontSize: '0.85rem',
          }}>
            <span>{item.name} × {item.quantity}</span>
            <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', fontWeight: 800, fontSize: '1rem' }}>
          <span>Total</span>
          <span style={{ color: 'var(--primary)' }}>₹{order.total?.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
