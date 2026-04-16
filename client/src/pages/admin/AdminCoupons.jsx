import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PercentIcon from '@mui/icons-material/Percent';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

const s = {
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
  },
  title: { fontFamily: 'Poppins', fontSize: '1.5rem', fontWeight: 800 },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.65rem 1.25rem', border: 'none', borderRadius: 'var(--radius)',
    background: 'var(--gradient-2)', color: '#fff', fontWeight: 600,
    cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'Inter',
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' },
  card: {
    background: '#fff', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow)', padding: '1.25rem', position: 'relative',
    border: '1px solid var(--border)',
  },
  code: {
    fontFamily: 'monospace', fontSize: '1.3rem', fontWeight: 800,
    color: 'var(--primary)', letterSpacing: '0.05em',
  },
  meta: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' },
  metaTag: {
    display: 'flex', alignItems: 'center', gap: '0.25rem',
    fontSize: '0.78rem', padding: '0.3rem 0.6rem', borderRadius: 999,
    background: 'var(--surface-2)', color: 'var(--text-2)',
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem',
  },
  modalCard: {
    background: '#fff', borderRadius: 'var(--radius-xl)',
    padding: '2rem', width: '100%', maxWidth: 480,
    boxShadow: 'var(--shadow-xl)',
  },
  formGroup: { marginBottom: '1rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.35rem' },
  input: {
    width: '100%', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '0.65rem 0.85rem', fontSize: '0.9rem', fontFamily: 'Inter',
    background: 'var(--surface)', outline: 'none',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  saveBtn: {
    width: '100%', padding: '0.85rem', border: 'none', borderRadius: 'var(--radius)',
    background: 'var(--gradient-1)', color: '#fff', fontWeight: 700,
    fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'Inter',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
  },
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: '', type: 'percentage', value: '', minOrder: '',
    maxDiscount: '', usageLimit: '', expiryDate: '', description: '',
  });

  useEffect(() => { loadCoupons(); }, []);

  const loadCoupons = async () => {
    try {
      const { data } = await adminAPI.getCoupons();
      setCoupons(data.coupons || []);
    } catch {}
    setLoading(false);
  };

  const handleChange = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.code || !form.value) return toast.error('Code and value required');
    try {
      const { data } = await adminAPI.createCoupon({
        ...form,
        value: parseFloat(form.value),
        minOrder: form.minOrder ? parseFloat(form.minOrder) : 0,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
      });
      setCoupons(prev => [data.coupon, ...prev]);
      setShowModal(false);
      setForm({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', usageLimit: '', expiryDate: '', description: '' });
      toast.success('Coupon created! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry';

  return (
    <div>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>🎟️ Coupons</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>{coupons.length} coupons created</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} style={s.addBtn}
          onClick={() => setShowModal(true)} id="create-coupon-btn"
        >
          <AddIcon style={{ fontSize: '1.1rem' }} /> Create Coupon
        </motion.button>
      </div>

      {loading ? (
        <div style={s.grid}>
          {[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: 160, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : coupons.length > 0 ? (
        <div style={s.grid}>
          {coupons.map(c => (
            <motion.div key={c._id} whileHover={{ y: -3 }} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={s.code}>{c.code}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '0.25rem' }}>
                    {c.type === 'percentage' ? `${c.value}% off` : `₹${c.value} flat off`}
                  </p>
                </div>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
                  background: c.isActive ? '#D1FAE5' : '#FEE2E2',
                  color: c.isActive ? '#065F46' : '#991B1B',
                }}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {c.description && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>{c.description}</p>
              )}
              <div style={s.meta}>
                <span style={s.metaTag}>
                  <CalendarTodayIcon style={{ fontSize: '0.75rem' }} /> {formatDate(c.expiryDate)}
                </span>
                {c.minOrder > 0 && (
                  <span style={s.metaTag}>Min ₹{c.minOrder}</span>
                )}
                {c.maxDiscount && (
                  <span style={s.metaTag}>Max ₹{c.maxDiscount}</span>
                )}
                {c.usageLimit && (
                  <span style={s.metaTag}>Used {c.usedCount || 0}/{c.usageLimit}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
          <LocalOfferIcon style={{ fontSize: '3rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>No coupons yet</p>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={s.modal} onClick={() => setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }} style={s.modalCard}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Create Coupon</h2>
                <button onClick={() => setShowModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                ><CloseIcon /></button>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Coupon Code</label>
                <input style={{ ...s.input, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700 }}
                  placeholder="e.g. SAVE20" value={form.code}
                  onChange={e => handleChange('code', e.target.value.toUpperCase())} />
              </div>

              <div style={s.row}>
                <div style={s.formGroup}>
                  <label style={s.label}>Type</label>
                  <select style={s.input} value={form.type} onChange={e => handleChange('type', e.target.value)}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Value</label>
                  <input style={s.input} type="number" placeholder={form.type === 'percentage' ? '20' : '100'}
                    value={form.value} onChange={e => handleChange('value', e.target.value)} />
                </div>
              </div>

              <div style={s.row}>
                <div style={s.formGroup}>
                  <label style={s.label}>Min Order (₹)</label>
                  <input style={s.input} type="number" placeholder="200"
                    value={form.minOrder} onChange={e => handleChange('minOrder', e.target.value)} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Max Discount (₹)</label>
                  <input style={s.input} type="number" placeholder="500"
                    value={form.maxDiscount} onChange={e => handleChange('maxDiscount', e.target.value)} />
                </div>
              </div>

              <div style={s.row}>
                <div style={s.formGroup}>
                  <label style={s.label}>Usage Limit</label>
                  <input style={s.input} type="number" placeholder="100"
                    value={form.usageLimit} onChange={e => handleChange('usageLimit', e.target.value)} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Expiry Date</label>
                  <input style={s.input} type="date"
                    value={form.expiryDate} onChange={e => handleChange('expiryDate', e.target.value)} />
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Description (optional)</label>
                <input style={s.input} placeholder="Get 20% off on your first order"
                  value={form.description} onChange={e => handleChange('description', e.target.value)} />
              </div>

              <motion.button whileTap={{ scale: 0.97 }} style={s.saveBtn} onClick={handleCreate}>
                <SaveIcon style={{ fontSize: '1.1rem' }} /> Create Coupon
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
