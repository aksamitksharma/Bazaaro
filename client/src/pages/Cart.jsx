import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { removeFromCart, updateQuantity, clearCart, selectCartTotal } from '../store/slices/cartSlice';
import { orderAPI, productAPI } from '../services/api';
import toast from 'react-hot-toast';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StorefrontIcon from '@mui/icons-material/Storefront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const qtyBtn = {
  width: 30, height: 30, borderRadius: '50%', border: '1.5px solid var(--border)',
  background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: '0.15s',
};

export default function Cart() {
  const { items, vendorName, vendorId } = useSelector(s => s.cart);
  const { user } = useSelector(s => s.auth);
  const total = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [comboAlert, setComboAlert] = React.useState(null);
  const [couponCode, setCouponCode] = React.useState('');
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);
  const [couponDiscount, setCouponDiscount] = React.useState(0);
  const [applying, setApplying] = React.useState(false);
  const [availableCoupons, setAvailableCoupons] = React.useState([]);
  const [acceptedCombo, setAcceptedCombo] = React.useState(null);

  React.useEffect(() => {
    if (items.length > 0) {
      productAPI.getCheapestCombo({ items }).then(res => {
        if (res.data?.combos?.length > 0) {
          const best = res.data.combos[0];
          if (best.type === 'split' && best.finalEstimatedCost < (total + 30)) {
            setComboAlert(best);
          } else if (best.type === 'single' && best.vendorId !== vendorId && best.finalEstimatedCost < (total + 30)) {
            setComboAlert(best);
          } else {
            setComboAlert(null);
          }
        }
      }).catch(() => {});
    } else {
      setComboAlert(null);
      setAcceptedCombo(null);
    }
  }, [items, vendorId, total]);

  React.useEffect(() => {
    if (vendorId) {
      orderAPI.getAvailableCoupons({ vendorId }).then(res => {
        if (res.data?.success) setAvailableCoupons(res.data.coupons);
      }).catch(() => {});
    }
  }, [vendorId]);

  const deliveryCharge = total >= 200 ? 0 : 30;
  // Final total after adding tax, delivery and subtracting discount
  const tax = Math.round(total * 0.05); // 5% tax from backend match
  const grandTotal = total + deliveryCharge + tax - couponDiscount;

  const handleApplyCoupon = async (codeToApply) => {
    const code = (typeof codeToApply === 'string' ? codeToApply : couponCode).trim();
    if (!code) return;
    setApplying(true);
    try {
      const { data } = await orderAPI.validateCoupon({
        code: code,
        subtotal: total,
        vendorId: vendorId
      });
      if (data.success) {
        setAppliedCoupon(data.code);
        setCouponDiscount(data.discount);
        toast.success(data.message || 'Coupon applied successfully');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const handleCheckout = async () => {
    if (!user) return toast.error('Please login first');
    
    let isSuccess = false;
    try {
      if (acceptedCombo) {
        if (acceptedCombo.type === 'split') {
          // Group products by vendor
          const vendorGroups = {};
          acceptedCombo.matchedProducts.forEach(p => {
             const vId = p.vendorId._id || p.vendorId;
             if(!vendorGroups[vId]) vendorGroups[vId] = [];
             vendorGroups[vId].push(p);
          });
          
          for (const [vId, vItems] of Object.entries(vendorGroups)) {
             await orderAPI.place({
               vendorId: vId,
               items: vItems.map(i => ({
                 productId: i._id, name: i.name, price: i.price,
                 quantity: i.quantity, image: i.images?.[0] || i.image,
               })),
               paymentMethod: 'cod',
               deliveryAddress: user.address,
             });
          }
          isSuccess = true;
        } else {
           await orderAPI.place({
               vendorId: acceptedCombo.vendorId,
               items: acceptedCombo.matchedProducts.map(i => ({
                 productId: i._id, name: i.name, price: i.price,
                 quantity: i.quantity, image: i.images?.[0] || i.image,
               })),
               paymentMethod: 'cod',
               deliveryAddress: user.address,
           });
           isSuccess = true;
        }
      } else {
        const vendorGroups = {};
        items.forEach(i => {
           const vId = i.vendorId || vendorId;
           if (!vendorGroups[vId]) vendorGroups[vId] = [];
           vendorGroups[vId].push(i);
        });

        for (const [vId, vItems] of Object.entries(vendorGroups)) {
          await orderAPI.place({
            vendorId: vId,
            items: vItems.map(i => ({
              productId: i.productId, name: i.name, price: i.price,
              quantity: i.quantity, image: i.image,
            })),
            paymentMethod: 'cod',
            couponCode: appliedCoupon || undefined,
            deliveryAddress: user?.address || { street: 'Default Address', city: 'Local', coordinates: { lat: 28.6, lng: 77.2 } },
          });
        }
        isSuccess = true;
      }
      
      if (isSuccess) {
        dispatch(clearCart());
        toast.success('Order placed! 🎉');
        navigate('/orders');
      }
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

      {comboAlert && !acceptedCombo && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
            color: '#fff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-md)', border: '2px solid #34D399'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <AutoAwesomeIcon style={{ color: '#FCD34D', fontSize: '1.8rem' }} />
            <div>
              <p style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.2rem' }}>Magic Combo Saver 🔥</p>
              {comboAlert.type === 'split' ? (
                 <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                   Auto-split this basket across <strong>{comboAlert.vendors.map(v => v.shopName).join(' & ')}</strong> to save money! 
                   Total estimated cost: <strong>₹{comboAlert.finalEstimatedCost.toFixed(0)}</strong>.
                 </p>
              ) : (
                 <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                   Get this exact same basket from <strong>{comboAlert.shopName}</strong> for only <strong>₹{comboAlert.finalEstimatedCost.toFixed(0)}</strong>!
                 </p>
              )}
            </div>
          </div>
          <button onClick={() => setAcceptedCombo(comboAlert)} style={{ background: '#fff', color: '#047857', border: 'none', padding: '0.6rem 1rem', borderRadius: 999, fontWeight: 800, cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
             Accept AI Deal & Save ₹{Math.max(0, (grandTotal - comboAlert.finalEstimatedCost)).toFixed(0)}
          </button>
        </motion.div>
      )}
      
      {acceptedCombo && (
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} style={{ background: '#ECFDF5', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', borderLeft: '4px solid #10B981' }}>
           <p style={{ fontWeight: 700, color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircleIcon style={{fontSize: '1rem'}} /> AI Deal Applied!</p>
           <p style={{ fontSize: '0.8rem', color: '#065F46', marginTop: '0.25rem' }}>You will checkout with the optimized combo cart. The original cart below is bypassed.</p>
           <button onClick={() => setAcceptedCombo(null)} style={{ background:'transparent', border:'none', color:'#10B981', textDecoration:'underline', cursor:'pointer', marginTop:'0.5rem', fontSize:'0.75rem', padding:0 }}>Cancel AI Deal</button>
        </motion.div>
      )}

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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-2)' }}>Taxes (5%)</span>
          <span style={{ fontWeight: 600 }}>₹{tax}</span>
        </div>
        {couponDiscount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--success)' }}>Discount ({appliedCoupon})</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>-₹{couponDiscount.toFixed(0)}</span>
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Total</span>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{Math.max(0, grandTotal).toFixed(0)}</span>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.5rem' }}>
          <input 
            placeholder="Got a Coupon Code?" 
            value={couponCode} 
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={!!appliedCoupon}
            style={{ 
              flex: 1, padding: '0.65rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--border)', 
              textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 600, outline: 'none',
              backgroundColor: appliedCoupon ? 'var(--surface-2)' : '#fff'
            }}
          />
          {appliedCoupon ? (
            <button onClick={removeCoupon}
              style={{
                padding: '0 1rem', background: 'var(--danger)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer'
              }}>
              Remove
            </button>
          ) : (
            <button onClick={handleApplyCoupon} disabled={applying || !couponCode.trim()}
              style={{
                padding: '0 1rem', background: 'var(--primary)', color: '#fff', border: 'none',
                borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', opacity: applying ? 0.7 : 1
              }}>
              {applying ? 'Applying...' : 'Apply'}
            </button>
          )}
        </div>

        {/* Available Coupons rendering */}
        {availableCoupons.length > 0 && !appliedCoupon && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.5rem' }}>Available Coupons</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {availableCoupons.map(c => (
                <div key={c._id} style={{
                  border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '0.75rem',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1)'
                }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.1rem 0.4rem', borderRadius: 4, fontSize: '0.75rem' }}>{c.code}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>{c.description}</p>
                  </div>
                  <button onClick={() => { setCouponCode(c.code); handleApplyCoupon(c.code); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                    APPLY
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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
