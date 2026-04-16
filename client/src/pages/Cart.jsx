import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { removeFromCart, updateQuantity, clearCart, selectCartTotal } from '../store/slices/cartSlice';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';

const qtyBtn = {
  width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)',
  background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: '0.15s',
};

export default function Cart() {
  const { items, vendorName } = useSelector(s => s.cart);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const deliveryCharge = total >= 200 ? 0 : 30;
  const grandTotal = total + deliveryCharge;

  const handleCheckout = async () => {
    try {
      const { data } = await orderAPI.place({
        items: items.map(i => ({
          productId: i.productId, name: i.name, price: i.price,
          quantity: i.quantity, image: i.image,
        })),
        paymentMethod: 'cod',
      });
      dispatch(clearCart());
      toast.success('Order placed! 🎉');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    }
  };

  if (items.length === 0) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-3)' }}>
      <ShoppingCartIcon style={{ fontSize: '4rem', opacity: 0.2, marginBottom: '1rem' }} />
      <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>Your cart is empty</h2>
      <p style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>Add items from nearby shops</p>
      <button onClick={() => navigate('/')}
        style={{
          background: 'var(--gradient-1)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius)', padding: '0.75rem 1.5rem', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.9rem',
        }}>
        Explore Shops
      </button>
    </motion.div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
        <ShoppingCartIcon style={{ color: 'var(--primary)', verticalAlign: 'middle' }} /> Cart
      </h1>
      <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <StorefrontIcon style={{ fontSize: '0.9rem' }} /> {vendorName}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', maxWidth: 700 }}>
        <AnimatePresence>
          {items.map(item => (
            <motion.div key={item.productId}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              style={{
                background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1rem',
                boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', gap: '1rem',
              }}
            >
              <div style={{
                width: 60, height: 60, borderRadius: 'var(--radius)', background: 'var(--surface-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                ) : <span style={{ fontSize: '1.5rem' }}>📦</span>}
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>₹{item.price} <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '0.75rem' }}>/ {item.unit}</span></p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button style={qtyBtn} onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity - 1 }))}>
                  <RemoveIcon style={{ fontSize: '1rem' }} />
                </button>
                <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                <button style={qtyBtn} onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: item.quantity + 1 }))}>
                  <AddIcon style={{ fontSize: '1rem' }} />
                </button>
              </div>

              <p style={{ fontWeight: 800, fontSize: '1rem', minWidth: 60, textAlign: 'right' }}>
                ₹{(item.price * item.quantity).toFixed(0)}
              </p>

              <button onClick={() => dispatch(removeFromCart(item.productId))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}>
                <DeleteOutlineIcon />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div style={{
        background: '#fff', borderRadius: 'var(--radius-lg)', padding: '1.5rem',
        boxShadow: 'var(--shadow)', marginTop: '1.5rem', maxWidth: 700,
      }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-2)' }}>Subtotal ({items.length} items)</span>
          <span style={{ fontWeight: 600 }}>₹{total.toFixed(0)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-2)' }}>Delivery</span>
          <span style={{ fontWeight: 600, color: deliveryCharge === 0 ? 'var(--secondary)' : 'var(--text)' }}>
            {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
          </span>
        </div>
        {deliveryCharge > 0 && (
          <p style={{ fontSize: '0.75rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>
            Add ₹{200 - total} more for free delivery!
          </p>
        )}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{grandTotal.toFixed(0)}</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button onClick={() => dispatch(clearCart())}
            style={{
              flex: 1, padding: '0.75rem', border: '2px solid var(--danger)', borderRadius: 'var(--radius)',
              background: 'transparent', color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}>
            Clear Cart
          </button>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={handleCheckout}
            style={{
              flex: 2, padding: '0.75rem', border: 'none', borderRadius: 'var(--radius)',
              background: 'var(--gradient-1)', color: '#fff', fontWeight: 700, cursor: 'pointer',
              fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            }}>
            Place Order (COD) <ArrowForwardIcon fontSize="small" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
