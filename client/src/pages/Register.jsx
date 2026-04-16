import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { setCredentials } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import PersonIcon from '@mui/icons-material/Person';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #064E3B 0%, #059669 40%, #10B981 100%)',
    padding: '1rem',
  },
  card: {
    background: '#fff', borderRadius: 'var(--radius-xl)', padding: '2.5rem 2rem',
    width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)',
  },
  logo: {
    fontFamily: 'Poppins', fontWeight: 800, fontSize: '2rem', textAlign: 'center',
    background: 'var(--gradient-2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    marginBottom: '0.25rem',
  },
  subtitle: { textAlign: 'center', color: 'var(--text-3)', fontSize: '0.9rem', marginBottom: '1.5rem' },
  roleRow: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
  rolePill: (active) => ({
    flex: 1, padding: '0.65rem 0', borderRadius: 999, border: '2px solid',
    borderColor: active ? 'var(--secondary)' : 'var(--border)',
    background: active ? 'var(--secondary)' : 'transparent',
    color: active ? '#fff' : 'var(--text-2)',
    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
    transition: '0.2s',
  }),
  inputGroup: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '0.75rem 1rem', marginBottom: '0.85rem', background: 'var(--surface)',
  },
  input: {
    border: 'none', outline: 'none', flex: 1, fontSize: '0.95rem',
    background: 'transparent', fontFamily: 'Inter', color: 'var(--text)',
  },
  btn: {
    width: '100%', padding: '0.9rem', border: 'none', borderRadius: 'var(--radius)',
    background: 'var(--gradient-2)', color: '#fff', fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', marginTop: '0.5rem', fontFamily: 'Inter',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
  },
  link: { color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none' },
  footer: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-2)' },
};

export default function Register() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', role: 'customer', shopName: '' });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) return toast.error('Name and phone are required');
    if (form.role === 'vendor' && !form.shopName) return toast.error('Shop name is required');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success('Registration successful! 🎉');
      const role = data.user.role;
      navigate(role === 'vendor' ? '/vendor' : role === 'delivery' ? '/delivery' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }} style={s.card}
      >
        <p style={s.logo}>🛒 Bazaaro</p>
        <p style={s.subtitle}>Create your account</p>

        {/* Role Selector */}
        <div style={s.roleRow}>
          {[
            { val: 'customer', icon: <ShoppingBagIcon fontSize="small" />, label: 'Customer' },
            { val: 'vendor', icon: <StorefrontIcon fontSize="small" />, label: 'Vendor' },
            { val: 'delivery', icon: <LocalShippingIcon fontSize="small" />, label: 'Delivery' },
          ].map(r => (
            <button key={r.val} type="button" style={s.rolePill(form.role === r.val)}
              onClick={() => update('role', r.val)} id={`role-${r.val}`}>
              {r.icon} {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.inputGroup}>
            <PersonIcon style={{ color: 'var(--text-3)' }} />
            <input style={s.input} placeholder="Full name" value={form.name}
              onChange={e => update('name', e.target.value)} id="reg-name" />
          </div>

          <div style={s.inputGroup}>
            <PhoneAndroidIcon style={{ color: 'var(--text-3)' }} />
            <input style={s.input} placeholder="Phone number" type="tel" value={form.phone}
              onChange={e => update('phone', e.target.value)} id="reg-phone" />
          </div>

          <div style={s.inputGroup}>
            <EmailIcon style={{ color: 'var(--text-3)' }} />
            <input style={s.input} placeholder="Email (optional)" type="email" value={form.email}
              onChange={e => update('email', e.target.value)} id="reg-email" />
          </div>

          <div style={s.inputGroup}>
            <LockIcon style={{ color: 'var(--text-3)' }} />
            <input style={s.input} placeholder="Password (optional)" type="password" value={form.password}
              onChange={e => update('password', e.target.value)} id="reg-password" />
          </div>

          {form.role === 'vendor' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <div style={s.inputGroup}>
                <StorefrontIcon style={{ color: 'var(--text-3)' }} />
                <input style={s.input} placeholder="Shop name" value={form.shopName}
                  onChange={e => update('shopName', e.target.value)} id="reg-shopname" />
              </div>
            </motion.div>
          )}

          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading} type="submit" id="register-btn">
            {loading ? 'Creating account...' : <>Create Account <ArrowForwardIcon fontSize="small" /></>}
          </motion.button>
        </form>

        <p style={s.footer}>
          Already have an account? <Link to="/login" style={s.link}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
